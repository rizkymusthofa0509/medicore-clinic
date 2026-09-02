<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\ObatAlkes;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeploymentSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_deployment_seed_is_protected_and_idempotent(): void
    {
        config(['app.deployment_seed_token' => 'deployment-test-secret']);

        $this->postJson('/api/deployment/seed')
            ->assertForbidden();

        $headers = ['X-Seed-Token' => 'deployment-test-secret'];
        $this->postJson('/api/deployment/seed', [], $headers)
            ->assertOk()
            ->assertJsonPath('success', true);

        $firstCounts = [
            'branches' => Branch::count(),
            'users' => User::count(),
            'obatAlkes' => ObatAlkes::count(),
        ];

        $this->postJson('/api/deployment/seed', [], $headers)
            ->assertOk();

        $this->assertSame($firstCounts['branches'], Branch::count());
        $this->assertSame($firstCounts['users'], User::count());
        $this->assertSame($firstCounts['obatAlkes'], ObatAlkes::count());
        $this->assertDatabaseHas('users', ['email' => 'admin@medicore.com']);
        $this->assertDatabaseHas('branches', ['code' => 'BR-001']);
    }
}
