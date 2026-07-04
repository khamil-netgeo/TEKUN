<?php

namespace App\Modules\PengurusanCawangan\Services;

use App\Models\Branch;
use App\Models\BranchPerformance;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class BranchService
{
    /**
     * Get paginated branch list with optional filters.
     * Branch managers only see their own branch; executives see all.
     */
    public function getBranches(User $user, array $filters = []): array
    {
        $query = Branch::query();

        // RBAC scope: branch_manager sees only own branch
        if ($user->role === 'pengurus_cawangan') {
            $query->where('code', $user->branch_code);
        }

        // Filters
        if (!empty($filters['state'])) {
            $query->where('state', $filters['state']);
        }
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'ilike', '%' . $filters['search'] . '%')
                  ->orWhere('code', 'ilike', '%' . $filters['search'] . '%')
                  ->orWhere('district', 'ilike', '%' . $filters['search'] . '%');
            });
        }
        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        $perPage = (int) ($filters['per_page'] ?? 20);
        $paginated = $query->orderBy('performance_rank')->paginate($perPage);

        return [
            'data'  => $paginated->items(),
            'meta'  => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
            'summary' => $this->getSummary($user),
        ];
    }

    /**
     * Get branch detail with staff count and recent performance.
     */
    public function getBranchDetail(User $user, int $id): Branch
    {
        $branch = Branch::findOrFail($id);

        // RBAC: branch manager can only view own branch
        if ($user->role === 'pengurus_cawangan' && $branch->code !== $user->branch_code) {
            abort(403, 'Akses ditolak: anda hanya boleh melihat cawangan anda sendiri.');
        }

        // Append last 6 months performance
        $branch->load(['performanceHistory' => function ($q) {
            $q->orderBy('period', 'desc')->limit(6);
        }]);

        return $branch;
    }

    /**
     * Get staff list for a branch.
     */
    public function getBranchStaff(User $user, int $id): array
    {
        $branch = Branch::findOrFail($id);

        // RBAC: branch manager can only view own branch staff
        if ($user->role === 'pengurus_cawangan' && $branch->code !== $user->branch_code) {
            abort(403, 'Akses ditolak: anda hanya boleh melihat kakitangan cawangan anda sendiri.');
        }

        $staff = User::where('branch_code', $branch->code)
            ->select('id', 'name', 'email', 'role', 'role_label', 'branch_code', 'created_at')
            ->get()
            ->map(function ($u) {
                return [
                    'id'           => $u->id,
                    'name'         => $u->name,
                    'email'        => $u->email,
                    'role'         => $u->role,
                    'role_label'   => $u->role_label,
                    'branch_code'  => $u->branch_code,
                    'joined_at'    => $u->created_at?->format('Y-m-d'),
                    // Workload metrics
                    'active_applications' => DB::table('applications')
                        ->where('officer_id', $u->id)
                        ->whereIn('status', ['submitted', 'under_review'])
                        ->count(),
                ];
            });

        return [
            'branch' => ['id' => $branch->id, 'code' => $branch->code, 'name' => $branch->name],
            'staff'  => $staff,
            'total'  => $staff->count(),
        ];
    }

    /**
     * Get ranked performance data for all branches.
     */
    public function getPerformanceRanking(User $user, string $period = null): array
    {
        $period = $period ?? now()->format('Y-m');

        $query = Branch::active()->orderBy('performance_rank');

        // Branch managers only see their own branch
        if ($user->role === 'pengurus_cawangan') {
            $query->where('code', $user->branch_code);
        }

        $branches = $query->get()->map(function ($b) use ($period) {
            // Get this period's performance record
            $perf = BranchPerformance::where('branch_id', $b->id)
                ->where('period', $period)
                ->first();

            return [
                'id'                  => $b->id,
                'code'                => $b->code,
                'name'                => $b->name,
                'state'               => $b->state,
                'performance_rank'    => $b->performance_rank,
                'collection_rate'     => $b->collection_rate,
                'npl_ratio'           => $b->npl_ratio,
                'monthly_target'      => $b->monthly_target,
                'monthly_actual'      => $b->monthly_actual,
                'achievement_percent' => $b->achievement_percent,
                'performance_status'  => $b->performance_status,
                'npl_status'          => $b->npl_status,
                'staff_count'         => $b->staff_count,
                'period_data'         => $perf ? [
                    'target_amount'         => $perf->target_amount,
                    'actual_amount'         => $perf->actual_amount,
                    'achievement_percent'   => $perf->achievement_percent,
                    'new_applications'      => $perf->new_applications,
                    'approved_applications' => $perf->approved_applications,
                ] : null,
            ];
        });

        return [
            'period'           => $period,
            'branches'         => $branches,
            'avg_collection'   => round($branches->avg('collection_rate'), 2),
            'avg_npl'          => round($branches->avg('npl_ratio'), 2),
            'top_branch'       => $branches->first(),
            'total_branches'   => $branches->count(),
        ];
    }

    /**
     * Update branch info.
     */
    public function updateBranch(User $user, int $id, array $data): Branch
    {
        $branch = Branch::findOrFail($id);

        // Only system_admin and executive can update any branch
        // Branch manager can only update own branch (limited fields)
        if ($user->role === 'pengurus_cawangan') {
            if ($branch->code !== $user->branch_code) {
                abort(403, 'Akses ditolak: anda hanya boleh mengemaskini cawangan anda sendiri.');
            }
            // Branch manager can only update contact info
            $data = array_intersect_key($data, array_flip(['phone', 'email', 'address', 'manager_name', 'manager_email']));
        }

        $branch->update($data);
        return $branch->fresh();
    }

    /**
     * Summary statistics for the branch list header.
     */
    private function getSummary(User $user): array
    {
        $query = Branch::active();
        if ($user->role === 'pengurus_cawangan') {
            $query->where('code', $user->branch_code);
        }
        $branches = $query->get();

        return [
            'total_branches'     => $branches->count(),
            'total_staff'        => $branches->sum('staff_count'),
            'avg_collection_rate'=> round($branches->avg('collection_rate'), 2),
            'avg_npl_ratio'      => round($branches->avg('npl_ratio'), 2),
        ];
    }
}
