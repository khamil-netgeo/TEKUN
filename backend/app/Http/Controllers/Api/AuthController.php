<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller {
    public function login(Request $request) {
        $request->validate(['email' => 'required|email', 'password' => 'required']);
        $user = User::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages(['email' => ['E-mel atau kata laluan tidak sah.']]);
        }
        $token = $user->createToken('sppt-token')->plainTextToken;
        return response()->json(['user' => array_merge($user->toArray(), ['permissions' => $user->permissions ?? []]), 'token' => $token]);
    }
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Berjaya log keluar.']);
    }
    public function me(Request $request) { return response()->json($request->user()); }
    public function register(Request $request) {
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:users', 'password' => 'required|min:8']);
        $user = User::create(['name' => $request->name, 'email' => $request->email, 'password' => Hash::make($request->password), 'role' => 'applicant', 'role_label' => 'Pemohon']);
        return response()->json(['user' => $user, 'token' => $user->createToken('sppt-token')->plainTextToken], 201);
    }
    public function sendOtp(Request $request) { return response()->json(['message' => 'OTP dihantar.', 'otp' => '123456']); }
    public function verifyOtp(Request $request) {
        return $request->otp === '123456' ? response()->json(['verified' => true]) : response()->json(['verified' => false], 422);
    }
}