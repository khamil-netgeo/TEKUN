<?php

namespace App\Modules\PengeluaranDana\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DisbursementController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                ['id' => 'SPPT-2026-07-00089', 'name' => 'Siti Nurhaliza', 'scheme' => 'TEKUN Usahawan', 'amount' => 25000, 'approved_date' => '2026-07-03', 'bank_status' => 'DISAHKAN', 'esign_status' => 'DITANDATANGANI', 'authority' => 'Pengurus Cawangan'],
                ['id' => 'SPPT-2026-07-00090', 'name' => 'Ahmad Razif', 'scheme' => 'TEKUN Micro', 'amount' => 8000, 'approved_date' => '2026-07-03', 'bank_status' => 'DISAHKAN', 'esign_status' => 'DITANDATANGANI', 'authority' => 'Pengurus Cawangan'],
                ['id' => 'SPPT-2026-07-00091', 'name' => 'Noraini Hassan', 'scheme' => 'TEKUN Wanita', 'amount' => 15000, 'approved_date' => '2026-07-02', 'bank_status' => 'DISAHKAN', 'esign_status' => 'MENUNGGU', 'authority' => 'Pengurus Cawangan'],
                ['id' => 'SPPT-2026-07-00092', 'name' => 'Zulkifli Omar', 'scheme' => 'TEKUN Usahawan', 'amount' => 45000, 'approved_date' => '2026-07-01', 'bank_status' => 'DISAHKAN', 'esign_status' => 'DITANDATANGANI', 'authority' => 'Jawatankuasa Kredit'],
            ],
            'meta' => ['total' => 23, 'ready' => 16, 'pending_esign' => 7, 'processed_today' => 8, 'total_amount' => 412500],
        ]);
    }

    public function create() {}

    public function store(Request $request)
    {
        return response()->json(['success' => true, 'message' => 'Pengeluaran berjaya dicipta.'], 201);
    }

    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => ['id' => $id, 'name' => 'Zulkifli Omar', 'amount' => 45000]]);
    }

    public function edit(string $id) {}

    public function update(Request $request, string $id)
    {
        return response()->json(['success' => true, 'message' => 'Rekod dikemaskini.']);
    }

    public function destroy(string $id)
    {
        return response()->json(['success' => true, 'message' => 'Rekod dipadam.']);
    }

    public function approve(Request $request, string $id)
    {
        return response()->json(['success' => true, 'message' => "Pengeluaran {$id} telah diluluskan.", 'data' => ['id' => $id, 'status' => 'DILULUSKAN', 'approved_at' => now()->toISOString()]]);
    }

    public function esign(Request $request, string $id)
    {
        return response()->json(['success' => true, 'message' => "e-Tandatangan untuk {$id} berjaya direkodkan.", 'data' => ['id' => $id, 'esign_status' => 'DITANDATANGANI', 'signed_at' => now()->toISOString()]]);
    }

    public function batch(Request $request)
    {
        $ids = $request->input('ids', []);
        return response()->json(['success' => true, 'message' => count($ids) . ' pengeluaran berjaya diproses dalam batch.', 'data' => ['batch_id' => 'BATCH-' . now()->format('YmdHis'), 'count' => count($ids), 'format' => 'ISO 20022']]);
    }

    public function esignQueue(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                ['id' => 'SPPT-00089', 'name' => 'Siti Nurhaliza', 'status' => 'DITANDATANGANI', 'days_left' => null, 'reminder' => 'Selesai'],
                ['id' => 'SPPT-00091', 'name' => 'Noraini Hassan', 'status' => 'MENUNGGU', 'days_left' => 6, 'reminder' => 'Peringatan Hari-3 Dihantar'],
                ['id' => 'SPPT-00095', 'name' => 'Sharifah', 'status' => 'TAMAT TEMPOH', 'days_left' => 0, 'reminder' => 'Eskalasi Automatik'],
            ],
            'stats' => ['signed' => 16, 'pending' => 7, 'expired' => 2, 'total' => 25],
        ]);
    }

    public function sendReminder(Request $request, string $id)
    {
        return response()->json(['success' => true, 'message' => "Peringatan e-tandatangan dihantar untuk {$id}.", 'data' => ['id' => $id, 'reminder_sent_at' => now()->toISOString(), 'channel' => ['sms', 'email']]]);
    }

    public function agingReport(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                ['id' => 'SPPT-00078', 'name' => 'Mohd Hafiz', 'officer' => 'Azri Bin Hamid', 'elapsed_hours' => 51, 'sla_category' => '>2 hari', 'status' => 'KRITIKAL'],
                ['id' => 'SPPT-00079', 'name' => 'Siti Rahimah', 'officer' => 'Nurul Ain', 'elapsed_hours' => 49, 'sla_category' => '>2 hari', 'status' => 'KRITIKAL'],
                ['id' => 'SPPT-00080', 'name' => 'Razif Ismail', 'officer' => 'Azri Bin Hamid', 'elapsed_hours' => 30, 'sla_category' => '1-2 hari', 'status' => 'AMARAN'],
            ],
            'summary' => ['critical' => 7, 'warning' => 12, 'normal' => 23, 'total' => 42],
        ]);
    }

    public function escalate(Request $request, string $id)
    {
        return response()->json(['success' => true, 'message' => "Fail {$id} telah dieskalasi kepada Pengurus Cawangan.", 'data' => ['id' => $id, 'escalated_to' => 'Pengurus Cawangan', 'escalated_at' => now()->toISOString()]]);
    }

    public function authorityMatrix(Request $request)
    {
        $amount = $request->input('amount', 0);
        $matrix = [
            ['level' => 1, 'role' => 'Pegawai Kewangan', 'min' => 0, 'max' => 10000, 'applicable' => $amount <= 10000],
            ['level' => 2, 'role' => 'Pengurus Cawangan', 'min' => 10001, 'max' => 30000, 'applicable' => $amount > 10000 && $amount <= 30000],
            ['level' => 3, 'role' => 'Jawatankuasa Kredit', 'min' => 30001, 'max' => 100000, 'applicable' => $amount > 30000 && $amount <= 100000],
            ['level' => 4, 'role' => 'Lembaga Pengarah', 'min' => 100001, 'max' => null, 'applicable' => $amount > 100000],
        ];
        return response()->json(['success' => true, 'data' => $matrix, 'amount' => $amount]);
    }
}
