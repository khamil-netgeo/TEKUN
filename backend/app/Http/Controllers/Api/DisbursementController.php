<?php

namespace App\Http\Controllers\Api;

/**
 * Thin alias kept for backward compatibility with routes/api.php.
 * All logic lives in App\Modules\PengeluaranDana\Controllers\DisbursementController.
 */
class DisbursementController extends \App\Modules\PengeluaranDana\Controllers\DisbursementController
{
    // Inherits all methods from the module controller.

    /**
     * Alias for sendReminder — called by routes/api.php as sendEsign.
     */
    public function sendEsign(\Illuminate\Http\Request $request, string $id)
    {
        return $this->sendReminder($request, $id);
    }
}
