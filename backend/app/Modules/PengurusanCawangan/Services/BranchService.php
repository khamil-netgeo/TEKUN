<?php

namespace App\Modules\PengurusanCawangan\Services;

use App\Models\Branch;
use App\Models\BranchPerformance;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Business logic for branch management with RBAC scoping.
 */
class BranchService
{
    /**
     * Get branches list with RBAC scoping.
     * - branch_manager / branch_officer: own branch only
     * - executive / system_admin: all branches
     */
    public function getBranches(User $user, array $filters = []): array
    {
        $query = Branch::query()->orderBy('performance_rank', 'asc');

        // RBAC scoping
        $role = $user->role ?? '';
        if (in_array($role, ['branch_manager', 'branch_officer'])) {
            $branchCode = $user->branch_code ?? null;
            if ($branchCode) {
                $query->where('code', $branchCode);
            }
        }

        // Filters
        if (!empty($filters['state'])) {
            $query->where('state', $filters['state']);
        }
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('code', 'ilike', "%{$search}%")
                  ->orWhere('district', 'ilike', "%{$search}%");
            });
        }
        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        $perPage = min((int)($filters['per_page'] ?? 20), 100);
        $paginator = $query->paginate($perPage);

        $summary = [
            'total_branches'      => Branch::count(),
            'total_staff'         => (int) Branch::sum('staff_count'),
            'avg_collection_rate' => round((float) Branch::avg('collection_rate'), 2),
            'avg_npl_ratio'       => round((float) Branch::avg('npl_ratio'), 2),
        ];

        return [
            'data'    => $paginator->items(),
            'meta'    => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
            'summary' => $summary,
        ];
    }

    /**
     * Get branch detail with performance history.
     */
    public function getBranchDetail(int $id, User $user): ?array
    {
        $branch = Branch::find($id);
        if (!$branch) return null;

        // RBAC: branch_manager/officer can only see their own branch
        $role = $user->role ?? '';
        if (in_array($role, ['branch_manager', 'branch_officer'])) {
            $branchCode = $user->branch_code ?? null;
            if ($branch->code !== $branchCode) return null;
        }

        $performance = BranchPerformance::where('branch_id', $id)
            ->orderBy('period', 'desc')
            ->take(6)
            ->get();

        return [
            'branch'      => $branch,
            'performance' => $performance,
        ];
    }

    /**
     * Get staff list for a branch.
     */
    public function getBranchStaff(int $id, User $user): ?array
    {
        $branch = Branch::find($id);
        if (!$branch) return null;

        // RBAC: branch_manager/officer can only see their own branch
        $role = $user->role ?? '';
        if (in_array($role, ['branch_manager', 'branch_officer'])) {
            $branchCode = $user->branch_code ?? null;
            if ($branch->code !== $branchCode) return null;
        }

        $staff = User::where('branch_code', $branch->code)
            ->select('id', 'name', 'email', 'role', 'role_label', 'branch_code', 'created_at')
            ->orderBy('role')
            ->get();

        return [
            'branch' => $branch,
            'staff'  => $staff,
            'total'  => $staff->count(),
        ];
    }

    /**
     * Get ranked performance data for all branches.
     */
    public function getPerformanceRanking(string $period = null): array
    {
        $period = $period ?? date('Y-m');

        $branches = Branch::orderBy('performance_rank', 'asc')->get();

        $ranked = $branches->map(function ($branch) use ($period) {
            $perf = BranchPerformance::where('branch_id', $branch->id)
                ->where('period', $period)
                ->first();

            return [
                'id'              => $branch->id,
                'code'            => $branch->code,
                'name'            => $branch->name,
                'state'           => $branch->state,
                'rank'            => $branch->performance_rank ?? 99,
                'collection_rate' => $perf ? (float)$perf->collection_rate : (float)$branch->collection_rate,
                'npl_ratio'       => $perf ? (float)$perf->npl_ratio : (float)$branch->npl_ratio,
                'target'          => $perf ? (float)$perf->target_collection_rate : 95.0,
                'disbursement'    => $perf ? (float)$perf->disbursement_amount : 0,
                'staff_count'     => (int)$branch->staff_count,
            ];
        });

        return [
            'period'          => $period,
            'branches'        => $ranked,
            'avg_collection'  => round((float) Branch::avg('collection_rate'), 2),
            'avg_npl'         => round((float) Branch::avg('npl_ratio'), 2),
            'total_branches'  => $branches->count(),
        ];
    }

    /**
     * Update branch information.
     */
    public function updateBranch(int $id, array $data): ?Branch
    {
        $branch = Branch::find($id);
        if (!$branch) return null;

        $branch->update($data);
        return $branch->fresh();
    }
}
