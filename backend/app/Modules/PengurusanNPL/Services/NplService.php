<?php
namespace App\Modules\PengurusanNPL\Services;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
class NplService
{
    private const BNM_THRESHOLD = 3.5;
    private const CACHE_TTL = 300;
    public function getDashboard(): array
    {
        return Cache::remember('npl_dashboard', self::CACHE_TTL, function () {
            $totalAccounts = DB::table('accounts')->count() ?: 1;
            $totalOutstanding = (float)(DB::table('accounts')->sum('outstanding_balance') ?: 0);
            $nplAccounts = DB::table('accounts')->whereIn('classification', ['npl_substandard','npl_doubtful','npl_loss'])->count();
            $nplOutstanding = (float)(DB::table('accounts')->whereIn('classification', ['npl_substandard','npl_doubtful','npl_loss'])->sum('outstanding_balance') ?: 0);
            $ratio = $totalOutstanding > 0 ? round(($nplOutstanding / $totalOutstanding) * 100, 2) : 0.0;
            $byBranch = DB::table('accounts as a')->leftJoin('applications as app','app.id','=','a.application_id')->leftJoin('branches as b','b.id','=','app.branch_id')->select(DB::raw("COALESCE(b.name,'Tidak Diketahui') as branch"),DB::raw('COUNT(*) as total'),DB::raw("SUM(CASE WHEN a.classification IN ('npl_substandard','npl_doubtful','npl_loss') THEN 1 ELSE 0 END) as npl_count"),DB::raw("COALESCE(SUM(a.outstanding_balance),0) as outstanding"),DB::raw("COALESCE(SUM(CASE WHEN a.classification IN ('npl_substandard','npl_doubtful','npl_loss') THEN a.outstanding_balance ELSE 0 END),0) as npl_outstanding"))->groupBy('b.name')->get()->map(function($row){$row->ratio=$row->outstanding>0?round(($row->npl_outstanding/$row->outstanding)*100,2):0.0;$row->risk_level=$row->ratio>=self::BNM_THRESHOLD?'high':($row->ratio>=2.0?'medium':'low');return $row;});
            $bySector = DB::table('accounts as a')->leftJoin('applications as app','app.id','=','a.application_id')->select(DB::raw("COALESCE(app.scheme,'Tidak Diketahui') as sector"),DB::raw('COUNT(*) as total'),DB::raw("SUM(CASE WHEN a.classification IN ('npl_substandard','npl_doubtful','npl_loss') THEN 1 ELSE 0 END) as npl_count"),DB::raw("COALESCE(SUM(a.outstanding_balance),0) as outstanding"))->groupBy('app.scheme')->get();
            $classifications = DB::table('accounts')->select('classification',DB::raw('COUNT(*) as count'),DB::raw('COALESCE(SUM(outstanding_balance),0) as amount'))->groupBy('classification')->get()->keyBy('classification');
            return ['total_npl'=>$nplAccounts,'ratio'=>$ratio,'bnm_threshold'=>self::BNM_THRESHOLD,'ratio_status'=>$ratio>=self::BNM_THRESHOLD?'exceeded':'safe','total_outstanding'=>$totalOutstanding,'npl_outstanding'=>$nplOutstanding,'total_accounts'=>$totalAccounts,'by_branch'=>$byBranch,'by_sector'=>$bySector,'classifications'=>$classifications,'generated_at'=>Carbon::now()->toISOString()];
        });
    }
    public function runAutoClassification(): array
    {
        $updated = 0;
        DB::table('accounts')->orderBy('id')->chunk(200, function($accounts) use (&$updated) {
            foreach ($accounts as $account) {
                $newClass = $this->classifyByDays((int)$account->arrears_days);
                if ($newClass !== $account->classification) {
                    DB::table('accounts')->where('id',$account->id)->update(['classification'=>$newClass,'updated_at'=>now()]);
                    $updated++;
                }
            }
        });
        Cache::forget('npl_dashboard');
        return ['updated'=>$updated,'classified_at'=>Carbon::now()->toISOString()];
    }
    public function classifyByDays(int $days): string
    {
        return match(true) {
            $days === 0 => 'lancar',
            $days <= 30 => 'perhatian_khusus',
            $days <= 90 => 'tidak_lancar',
            $days <= 180 => 'npl_substandard',
            $days <= 365 => 'npl_doubtful',
            default => 'npl_loss',
        };
    }
    public function triggerDunning(int $accountId): array
    {
        $account = DB::table('accounts')->where('id',$accountId)->first();
        if (!$account) return ['success'=>false,'message'=>'Akaun tidak dijumpai.'];
        $stage = $this->getDunningStage((int)$account->arrears_days);
        DB::table('dunning_actions')->insert(['account_id'=>$accountId,'action_type'=>$stage['type'],'channel'=>$stage['channel'],'status'=>'sent','notes'=>"Notis {$stage['type']} dihantar. Hari tertunggak: {$account->arrears_days}.",'is_automated'=>true,'actioned_at'=>now(),'created_at'=>now(),'updated_at'=>now()]);
        Cache::forget('npl_dashboard');
        return ['success'=>true,'notis_sent'=>1,'channel'=>$stage['channel'],'stage'=>$stage['stage'],'type'=>$stage['type'],'account_id'=>$accountId,'arrears_days'=>$account->arrears_days,'sent_at'=>Carbon::now()->toISOString()];
    }
    private function getDunningStage(int $days): array
    {
        return match(true) {
            $days > 180 => ['stage'=>4,'type'=>'legal','channel'=>'post','label'=>'Rujukan Litigasi (>180 hari)'],
            $days > 90 => ['stage'=>3,'type'=>'notis3','channel'=>'post','label'=>'Notis Rasmi (91-180 hari)'],
            $days > 30 => ['stage'=>2,'type'=>'notis2','channel'=>'email','label'=>'Surat Peringatan (31-90 hari)'],
            $days > 0 => ['stage'=>1,'type'=>'notis1','channel'=>'sms','label'=>'SMS/E-mel (1-30 hari)'],
            default => ['stage'=>0,'type'=>'none','channel'=>'none','label'=>'Tiada Tindakan'],
        };
    }
    public function getCollectionTasks(array $filters = []): array
    {
        $query = DB::table('collection_tasks as ct')->join('accounts as a','a.id','=','ct.account_id')->select('ct.id','ct.account_id','ct.status','ct.priority_score','ct.ai_suggested_channel','ct.ai_best_contact_time','ct.ai_recommendation','ct.last_outcome','ct.attempt_count','ct.follow_up_at','a.account_no','a.borrower_name','a.outstanding_balance','a.arrears_amount','a.arrears_days','a.classification')->orderByDesc('ct.priority_score')->orderBy('ct.follow_up_at');
        if (!empty($filters['status'])) $query->where('ct.status',$filters['status']);
        if (!empty($filters['classification'])) $query->where('a.classification',$filters['classification']);
        $tasks = $query->limit(50)->get();
        return ['data'=>$tasks,'total'=>$tasks->count(),'ai_prioritized'=>true,'generated_at'=>Carbon::now()->toISOString()];
    }
    public function logOutcome(int $taskId, array $data): array
    {
        $task = DB::table('collection_tasks')->where('id',$taskId)->first();
        if (!$task) return ['success'=>false,'message'=>'Tugasan tidak dijumpai.'];
        $followUpAt = !empty($data['follow_up_days']) ? Carbon::now()->addDays((int)$data['follow_up_days']) : Carbon::now()->addDays(7);
        DB::table('collection_tasks')->where('id',$taskId)->update(['last_outcome'=>$data['outcome']??'contacted','attempt_count'=>$task->attempt_count+1,'status'=>$data['status']??'in_progress','follow_up_at'=>$followUpAt,'updated_at'=>now()]);
        return ['success'=>true,'task_id'=>$taskId,'outcome'=>$data['outcome']??'contacted','follow_up_at'=>$followUpAt->toISOString(),'logged_at'=>Carbon::now()->toISOString()];
    }
    public function getAiBestContactTime(int $accountId): array
    {
        $account = DB::table('accounts')->where('id',$accountId)->first();
        if (!$account) return ['time'=>'10:00','channel'=>'sms','confidence'=>0];
        $channel = $account->arrears_days > 60 ? 'call' : 'sms';
        $time = $account->arrears_days > 90 ? '09:30' : '14:00';
        $confidence = min(95, 50 + (int)($account->arrears_days / 10));
        return ['account_id'=>$accountId,'channel'=>$channel,'best_time'=>$time,'confidence'=>$confidence,'reason'=>"Berdasarkan {$account->arrears_days} hari tertunggak."];
    }
}
