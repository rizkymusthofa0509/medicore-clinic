<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SettingController extends Controller
{
    // ==================== BRANCH ====================

    public function getBranches()
    {
        $branches = Branch::all();
        return response()->json([
            'success' => true,
            'data' => $branches,
        ]);
    }

    public function storeBranch(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:branches,code',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'operational_hours' => 'nullable|string',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        $branch = Branch::create($request->only([
            'name', 'code', 'address', 'phone', 'operational_hours', 'status'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Branch berhasil ditambahkan',
            'data' => $branch,
        ], 201);
    }

    public function updateBranch(Request $request, $id)
    {
        $branch = Branch::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:branches,code,' . $id,
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'operational_hours' => 'nullable|string',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        $branch->update($request->only([
            'name', 'code', 'address', 'phone', 'operational_hours', 'status'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Branch berhasil diperbarui',
            'data' => $branch,
        ]);
    }

    public function deleteBranch($id)
    {
        $branch = Branch::findOrFail($id);
        $branch->delete();

        return response()->json([
            'success' => true,
            'message' => 'Branch berhasil dihapus',
        ]);
    }

    // ==================== USER ====================

    public function getUsers()
    {
        $users = User::with('branch')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'branch_id' => $user->branch_id,
                'branch_name' => $user->branch ? $user->branch->name : '-',
                'created_at' => $user->created_at->format('d-m-Y H:i'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function storeUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|in:admin,user',
            'branch_id' => 'required|exists:branches,id',
            'is_active' => 'boolean',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'branch_id' => $request->branch_id,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil ditambahkan',
            'data' => $user,
        ], 201);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|min:6',
            'role' => 'required|in:admin,user',
            'branch_id' => 'required|exists:branches,id',
            'is_active' => 'boolean',
        ]);

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'branch_id' => $request->branch_id,
            'is_active' => $request->is_active ?? $user->is_active,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil diperbarui',
            'data' => $user,
        ]);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dihapus',
        ]);
    }

    // ==================== USER BRANCHES ====================

    public function getUserBranches($userId)
    {
        $user = User::with('branches')->findOrFail($userId);

        return response()->json([
            'success' => true,
            'data' => $user->branches->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                    'is_default' => $branch->pivot->is_default,
                ];
            }),
        ]);
    }

    public function syncUserBranches(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        $request->validate([
            'branches' => 'required|array',
            'branches.*.id' => 'required|exists:branches,id',
            'branches.*.is_default' => 'boolean',
        ]);

        $syncData = [];
        foreach ($request->branches as $branch) {
            $syncData[$branch['id']] = ['is_default' => $branch['is_default'] ?? false];
        }

        $user->branches()->sync($syncData);

        return response()->json([
            'success' => true,
            'message' => 'Branch user berhasil disinkronisasi',
        ]);
    }
}
