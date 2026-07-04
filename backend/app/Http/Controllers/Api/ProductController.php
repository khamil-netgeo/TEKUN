<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => [
                ['id' => 'SKM-001', 'name' => 'TEKUN Micro', 'max_amount' => 10000, 'rate' => 4.0, 'tenure' => 36, 'status' => 'Aktif'],
                ['id' => 'SKM-002', 'name' => 'TEKUN Usahawan', 'max_amount' => 50000, 'rate' => 4.0, 'tenure' => 60, 'status' => 'Aktif'],
                ['id' => 'SKM-003', 'name' => 'TEKUN Wanita', 'max_amount' => 30000, 'rate' => 3.5, 'tenure' => 60, 'status' => 'Aktif'],
                ['id' => 'SKM-004', 'name' => 'TEKUN Belia', 'max_amount' => 20000, 'rate' => 3.5, 'tenure' => 48, 'status' => 'Aktif'],
            ]
        ]);
    }

    public function show($id)
    {
        $products = [
            'SKM-001' => ['id' => 'SKM-001', 'name' => 'TEKUN Micro', 'max_amount' => 10000, 'rate' => 4.0, 'tenure' => 36, 'status' => 'Aktif', 'eligibility' => ['min_age' => 18, 'max_age' => 60, 'min_income' => 1000]],
            'SKM-002' => ['id' => 'SKM-002', 'name' => 'TEKUN Usahawan', 'max_amount' => 50000, 'rate' => 4.0, 'tenure' => 60, 'status' => 'Aktif', 'eligibility' => ['min_age' => 18, 'max_age' => 60, 'min_income' => 2000]],
            'SKM-003' => ['id' => 'SKM-003', 'name' => 'TEKUN Wanita', 'max_amount' => 30000, 'rate' => 3.5, 'tenure' => 60, 'status' => 'Aktif', 'eligibility' => ['gender' => 'F', 'min_age' => 18, 'max_age' => 60]],
            'SKM-004' => ['id' => 'SKM-004', 'name' => 'TEKUN Belia', 'max_amount' => 20000, 'rate' => 3.5, 'tenure' => 48, 'status' => 'Aktif', 'eligibility' => ['min_age' => 18, 'max_age' => 30]],
        ];
        $product = $products[$id] ?? null;
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak dijumpai.'], 404);
        }
        return response()->json(['success' => true, 'data' => $product]);
    }

    public function update(Request $request, $id)
    {
        return response()->json(['message' => 'Product updated', 'id' => $id]);
    }
}
