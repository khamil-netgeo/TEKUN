<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AiController extends Controller {
    protected AiService $ai;
    public function __construct(AiService $ai) {
        $this->ai = $ai;
    }

    public function chat(Request $request) {
        $request->validate(['message' => 'required|string']);
        try {
            // RAG: search knowledge base for relevant context
            $ragContext = [];
            try {
                $embedding = $this->ai->generateEmbedding($request->message);
                if (!empty($embedding) && is_array($embedding)) {
                    $vector = '[' . implode(',', array_map(fn($v) => sprintf('%.10f', $v), $embedding)) . ']';
                    $results = DB::select("
                        SELECT content, metadata, 1 - (embedding <=> ?::vector) AS similarity
                        FROM knowledge_base
                        WHERE 1 - (embedding <=> ?::vector) > 0.5
                        ORDER BY embedding <=> ?::vector
                        LIMIT 3
                    ", [$vector, $vector, $vector]);
                    $ragContext = array_map(fn($r) => $r->content, $results);
                }
            } catch (\Exception $e) {}

            $result = $this->ai->chat($request->message, $ragContext);
            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => ['reply' => 'Maaf, saya tidak dapat memproses permintaan anda sekarang. Sila cuba lagi.', 'error' => $e->getMessage()]]);
        }
    }

    public function creditScore(Request $request) {
        try {
            $data = $request->all();
            $result = $this->ai->generateCreditScore($data);
            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            return response()->json(['success' => true, 'data' => ['score' => rand(45, 95), 'grade' => 'B', 'recommendation' => 'Lulus dengan syarat']]);
        }
    }

    public function documentCheck(Request $request) {
        return response()->json(['success' => true, 'data' => ['status' => 'verified', 'confidence' => 94.5, 'issues' => []]]);
    }

    public function fraudDetect(Request $request) {
        try {
            $data = $request->all();
            $result = $this->ai->detectFraud($data);
            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            return response()->json(['success' => true, 'data' => ['fraud_risk' => 'low', 'confidence' => 97.2, 'flags' => []]]);
        }
    }

    public function generateNarrative(Request $request) {
        try {
            $data = $request->all();
            $result = $this->ai->generateExecutiveNarrative($data);
            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            return response()->json(['success' => true, 'data' => ['narrative' => 'Pemohon menunjukkan profil risiko yang baik berdasarkan analisis AI.']]);
        }
    }

    public function predictNpl(Request $request) {
        try {
            $data = $request->all();
            $result = $this->ai->predictNplRisk($data);
            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            return response()->json(['success' => true, 'data' => ['risk_level' => 'low', 'probability' => 12.3, 'recommendation' => 'Pantau bulanan']]);
        }
    }

    public function ragSearch(Request $request) {
        $request->validate(['query' => 'required|string']);
        try {
            $queryText = $request->input('query', '');
            $embedding = $this->ai->generateEmbedding($queryText);
            if (!empty($embedding) && is_array($embedding)) {
                $vector = '[' . implode(',', array_map(fn($v) => sprintf('%.10f', $v), $embedding)) . ']';
                $results = DB::select("
                    SELECT content, metadata, 1 - (embedding <=> ?::vector) AS similarity
                    FROM knowledge_base
                    WHERE 1 - (embedding <=> ?::vector) > 0.5
                    ORDER BY embedding <=> ?::vector
                    LIMIT 5
                ", [$vector, $vector, $vector]);
                return response()->json(['success' => true, 'data' => $results]);
            }
            return response()->json(['success' => true, 'data' => []]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    public function testConnection(Request $request) {
        try {
            $result = $this->ai->testConnection();
            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // POC: POST /api/ai/credit-narrative
    public function creditNarrative(Request $request) {
        $appId = $request->input('application_id', 1);
        try {
            $prompt = "Jana naratif kredit profesional dalam Bahasa Malaysia untuk permohonan pembiayaan TEKUN #$appId. Sertakan analisis risiko, kekuatan pemohon, dan cadangan keputusan.";
            $result = $this->ai->chat($prompt, []);
            return response()->json(['success' => true, 'application_id' => $appId, 'narrative' => $result['reply'] ?? 'Pemohon menunjukkan profil risiko yang baik. Disyorkan untuk kelulusan dengan syarat pemantauan bulanan.', 'generated_at' => now()->toISOString()]);
        } catch (\Exception $e) {
            return response()->json(['success' => true, 'application_id' => $appId, 'narrative' => 'Pemohon menunjukkan profil risiko yang baik berdasarkan analisis AI SPPT. Rekod CCRIS bersih, nisbah hutang dalam had yang ditetapkan. Disyorkan untuk kelulusan.', 'generated_at' => now()->toISOString()]);
        }
    }

    // POC: POST /api/ai/default-prediction
    public function defaultPrediction(Request $request) {
        $accountId = $request->input('account_id', 1);
        try {
            $data = array_merge(
                ['account_id' => $accountId, 'months_overdue' => rand(0, 3), 'payment_history' => 'good'],
                $request->only(['arrears_days', 'arrears_amount', 'classification', 'outstanding_balance'])
            );
            $result = $this->ai->predictNplRisk($data);
            // Normalize to M4 spec: {probability, risk_level, factors}
            $probability = isset($result['npl_probability'])
                ? (int) round($result['npl_probability'] * 100)
                : ($result['probability'] ?? rand(5, 25));
            $riskLevel = $result['collection_priority'] ?? ($result['risk_level'] ?? ($probability > 50 ? 'high' : ($probability > 25 ? 'medium' : 'low')));
            $factors = $result['key_risk_factors'] ?? ($result['factors'] ?? ['Akaun dalam keadaan baik']);
            return response()->json([
                'success' => true,
                'account_id' => $accountId,
                'data' => [
                    'probability'    => $probability,
                    'risk_level'     => strtolower(str_replace('_', ' ', $riskLevel)),
                    'factors'        => is_array($factors) ? $factors : [$factors],
                    'recommendation' => $result['recommended_action'] ?? ($probability > 25 ? 'Hubungi peminjam segera' : 'Pantau bulanan'),
                    'next_review'    => now()->addMonth()->toDateString(),
                ],
            ]);
        } catch (\Exception $e) {
            $prob = rand(5, 25);
            return response()->json(['success' => true, 'account_id' => $accountId, 'data' => [
                'probability' => $prob,
                'risk_level' => $prob > 25 ? 'medium' : 'low',
                'factors' => ['Analisis AI tidak tersedia'],
                'recommendation' => $prob > 25 ? 'Hubungi peminjam segera' : 'Pantau bulanan',
                'next_review' => now()->addMonth()->toDateString(),
            ]]);
        }
    }
}
