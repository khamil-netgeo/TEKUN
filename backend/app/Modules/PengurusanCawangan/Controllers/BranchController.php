<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => [
                ['id' => 'CW-001', 'name' => 'Cawangan KL Sentral', 'state' => 'WP Kuala Lumpur', 'staff' => 12, 'collection_rate' => 94, 'npl_ratio' => 1.2],
                ['id' => 'CW-002', 'name' => 'Cawangan Shah Alam', 'state' => 'Selangor', 'staff' => 9, 'collection_rate' => 88, 'npl_ratio' => 2.1],
                ['id' => 'CW-003', 'name' => 'Cawangan Johor Bahru', 'state' => 'Johor', 'staff' => 11, 'collection_rate' => 92, 'npl_ratio' => 1.8],
            ],
            'total' => 48
        ]);
    }

    public function performance()
    {
        return response()->json([
            'avg_collection' => 89.4,
            'avg_npl' => 1.8,
            'top_branch' => 'CW-001',
            'total_branches' => 48
        ]);
    }
}
