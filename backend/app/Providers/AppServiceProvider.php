<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     * Dynamically binds all module services to the container.
     */
    public function register(): void
    {
        // Module Service Bindings
        // Auto-registered to ensure all module services are resolvable via DI
        $this->app->bind(\App\Modules\AuditKawalan\Services\AnomalyDetectionService::class);
        $this->app->bind(\App\Modules\AuditKawalan\Services\ComplianceReportService::class);
        $this->app->bind(\App\Modules\CRMUsahawan\Services\EntrepreneurService::class);
        $this->app->bind(\App\Modules\IntegrasiAPI\Services\IntegrationHealthService::class);
        $this->app->bind(\App\Modules\LaporanAnalitik\Services\AnalyticsService::class);
        $this->app->bind(\App\Modules\LaporanAnalitik\Services\ReportExportService::class);
        $this->app->bind(\App\Modules\PengeluaranDana\Services\DisbursementService::class);
        $this->app->bind(\App\Modules\PengurusanAkaun\Services\AiDefaultPredictionService::class);
        $this->app->bind(\App\Modules\PengurusanAkaun\Services\TawidhService::class);
        $this->app->bind(\App\Modules\PengurusanCawangan\Services\BranchService::class);
        $this->app->bind(\App\Modules\PengurusanNPL\Services\NplService::class);
        $this->app->bind(\App\Modules\PenilaianKredit\Services\AmortizationService::class);
        $this->app->bind(\App\Modules\PenilaianKredit\Services\CreditScoringService::class);
        $this->app->bind(\App\Modules\PenilaianKredit\Services\OfferLetterService::class);
        $this->app->bind(\App\Modules\PentadbiranSistem\Services\AdminService::class);
        $this->app->bind(\App\Modules\ProdukPembiayaan\Services\EligibilityCheckerService::class);
        $this->app->bind(\App\Modules\ProdukPembiayaan\Services\ProductService::class);
    }

    /**
     * Bootstrap any application services.
     * Dynamically loads all module routes from app/Modules/{ModuleName}/Routes/api.php
     */
    public function boot(): void
    {
        $this->loadModuleRoutes();
    }

    /**
     * Dynamically load routes from all module Route files.
     */
    protected function loadModuleRoutes(): void
    {
        $modulesPath = app_path('Modules');

        if (!is_dir($modulesPath)) {
            return;
        }

        foreach (glob($modulesPath . '/*/Routes/api.php') as $routeFile) {
            Route::middleware('api')
                ->prefix('api')
                ->group($routeFile);
        }
    }
}
