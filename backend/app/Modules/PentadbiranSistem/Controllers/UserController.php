<?php
namespace App\Modules\PentadbiranSistem\Controllers;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = DB::table('users')
            ->select('id', 'name', 'email', 'created_at')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $users->items(),
            'total' => $users->total(),
            'active' => DB::table('users')->count(),
        ]);
    }

    public function show($id)
    {
        $user = DB::table('users')->where('id', $id)->first();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Pengguna tidak dijumpai.'], 404);
        }
        return response()->json(['success' => true, 'data' => $user]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
        ]);
        $id = DB::table('users')->insertGetId([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['message' => 'User created', 'id' => $id], 201);
    }

    public function update(Request $request, $id)
    {
        DB::table('users')->where('id', $id)->update($request->only(['name', 'email']));
        return response()->json(['message' => 'User updated', 'id' => $id]);
    }

    public function suspend($id)
    {
        return response()->json(['message' => 'User suspended', 'id' => $id]);
    }
}
