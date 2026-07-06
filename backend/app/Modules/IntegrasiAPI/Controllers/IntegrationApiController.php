<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class HealthController extends Controller
{
    /**
     * Check the health of the application and external services.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        // Set a max execution time to prevent the script from running indefinitely
        set_time_limit(30);

        try {
            // Enforce a strict timeout of 3 seconds (< 5s) to prevent hanging during tests/outages
            $response = Http::timeout(3)
                ->connectTimeout(2)
                ->get('https://api.example.com/service/health');

            if (! $response->successful()) {
                throw new Exception('External service returned a non-200 response.');
            }

            $data = $response->json() ?? [];
            $data['status'] = 'healthy';

            // Cache the successful state to use as a fallback if it goes down
            Cache::put('health_check_last_known_state', $data, now()->addMinutes(10));

            return response()->json($data);

        } catch (Exception $e) {
            // Retrieve cached data or use a default mock structure
            $mockData = Cache::get('health_check_last_known_state', [
                'service' => 'api.example.com',
                'components' => [
                    'database' => 'unknown',
                    'cache' => 'unknown'
                ]
            ]);

            // Override status to degraded
            $mockData['status'] = 'degraded';
            $mockData['message'] = $e->getMessage();
            $mockData['timestamp'] = now()->toIso8601String();

            return response()->json($mockData);
        }
    }
}