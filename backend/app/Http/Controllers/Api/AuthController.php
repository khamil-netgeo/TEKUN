<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

/**
 * Core Foundation Controller: AuthController
 * POST /api/auth/login        - Login with email + password
 * POST /api/auth/logout       - Revoke current token
 * GET  /api/auth/me           - Get authenticated user profile
 * POST /api/auth/refresh      - Refresh token (revoke + reissue)
 * POST /api/auth/otp/send     - Send OTP via SMS or email
 * POST /api/auth/otp/verify   - Verify OTP code
 * POST /api/auth/register     - Register new account
 * POST /api/auth/password/reset - Reset password (requires OTP)
 *
 * Password policy: min 12 chars, uppercase+lowercase+number+symbol, expiry 90 days.
 */
class AuthController extends Controller
{
    public function __construct(private OtpService $otpService) {}

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['E-mel atau kata laluan tidak sah.'],
            ]);
        }

        if (isset($user->is_active) && !$user->is_active) {
            return response()->json(['message' => 'Akaun anda tidak aktif. Sila hubungi Pentadbir Sistem.'], 403);
        }

        if (isset($user->is_suspended) && $user->is_suspended) {
            return response()->json(['message' => 'Akaun anda telah digantung. Sila hubungi Pentadbir Sistem.'], 403);
        }

        if (isset($user->password_expires_at) && $user->password_expires_at && Carbon::parse($user->password_expires_at)->isPast()) {
            return response()->json([
                'message'          => 'Kata laluan anda telah tamat tempoh. Sila tetapkan semula kata laluan.',
                'password_expired' => true,
            ], 401);
        }

        $user->tokens()->delete();
        $token = $user->createToken('sppt-token')->plainTextToken;

        $user->update([
            'last_login_at' => Carbon::now(),
            'last_login_ip' => $request->ip(),
        ]);

        return response()->json([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Berjaya log keluar.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->formatUser($request->user()));
    }

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();
        $token = $user->createToken('sppt-token')->plainTextToken;
        return response()->json(['token' => $token, 'user' => $this->formatUser($user)]);
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users'],
            'password' => [
                'required', 'confirmed',
                PasswordRule::min(12)->mixedCase()->numbers()->symbols(),
            ],
        ], [
            'password.min'        => 'Kata laluan perlu sekurang-kurangnya 12 aksara.',
            'password.mixed_case' => 'Kata laluan perlu mengandungi huruf besar dan huruf kecil.',
            'password.numbers'    => 'Kata laluan perlu mengandungi sekurang-kurangnya satu nombor.',
            'password.symbols'    => 'Kata laluan perlu mengandungi sekurang-kurangnya satu simbol.',
        ]);

        $now  = Carbon::now();
        $user = User::create([
            'name'                => $request->name,
            'email'               => $request->email,
            'password'            => Hash::make($request->password),
            'role'                => 'usahawan',
            'role_label'          => 'Usahawan',
            'is_active'           => true,
            'is_suspended'        => false,
            'password_changed_at' => $now,
            'password_expires_at' => $now->copy()->addDays(90),
            'permissions'         => [
                'modules'        => ['module1'],
                'actions'        => ['application.create', 'application.view_own'],
                'data_scope'     => 'own',
                'approval_limit' => 0,
            ],
        ]);

        $token = $user->createToken('sppt-token')->plainTextToken;
        return response()->json(['user' => $this->formatUser($user), 'token' => $token], 201);
    }

    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'identifier' => ['required', 'string'],
            'channel'    => ['required', 'in:sms,email'],
            'purpose'    => ['sometimes', 'in:verification,password_reset,login_2fa'],
        ]);

        $result = $this->otpService->send(
            $request->identifier,
            $request->channel,
            $request->input('purpose', 'verification')
        );

        return response()->json($result);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'identifier' => ['required', 'string'],
            'channel'    => ['required', 'in:sms,email'],
            'code'       => ['required', 'string', 'size:6'],
            'purpose'    => ['sometimes', 'in:verification,password_reset,login_2fa'],
        ]);

        $result = $this->otpService->verify(
            $request->identifier,
            $request->channel,
            $request->code,
            $request->input('purpose', 'verification')
        );

        return response()->json($result, $result['verified'] ? 200 : 422);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email', 'exists:users,email'],
            'otp_code' => ['required', 'string', 'size:6'],
            'password' => ['required', 'confirmed', PasswordRule::min(12)->mixedCase()->numbers()->symbols()],
        ]);

        $otpResult = $this->otpService->verify($request->email, 'email', $request->otp_code, 'password_reset');
        if (!$otpResult['verified']) {
            return response()->json(['message' => $otpResult['message']], 422);
        }

        $now  = Carbon::now();
        $user = User::where('email', $request->email)->firstOrFail();
        $user->update([
            'password'            => Hash::make($request->password),
            'password_changed_at' => $now,
            'password_expires_at' => $now->copy()->addDays(90),
        ]);
        $user->tokens()->delete();

        return response()->json(['message' => 'Kata laluan berjaya ditetapkan semula. Sila log masuk semula.']);
    }

    private function formatUser(User $user): array
    {
        return [
            'id'                  => $user->id,
            'name'                => $user->name,
            'email'               => $user->email,
            'phone_number'        => $user->phone_number ?? null,
            'role'                => $user->role,
            'role_label'          => $user->role_label,
            'branch'              => $user->branch,
            'branch_code'         => $user->branch_code,
            'state'               => $user->state,
            'is_active'           => $user->is_active ?? true,
            'permissions'         => $user->permissions,
            'password_expires_at' => isset($user->password_expires_at) ? Carbon::parse($user->password_expires_at)->toISOString() : null,
            'last_login_at'       => isset($user->last_login_at) ? Carbon::parse($user->last_login_at)->toISOString() : null,
        ];
    }
}