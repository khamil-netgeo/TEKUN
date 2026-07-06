<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * AddContentLength Middleware
 *
 * Adds Content-Length header to all responses so HTTP clients
 * (browsers, curl) know when the response body ends without
 * waiting for the TCP connection to close.
 *
 * This is required because php artisan serve does not automatically
 * send Content-Length headers, causing browsers to hang indefinitely.
 */
class AddContentLength
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Don't modify streamed or file responses
        if ($response instanceof StreamedResponse || $response instanceof BinaryFileResponse) {
            return $response;
        }

        $content = $response->getContent();
        if ($content !== false) {
            $response->headers->set('Content-Length', strlen($content));
        }

        return $response;
    }
}
