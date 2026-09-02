<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Isi CORS_ALLOWED_ORIGINS dengan URL frontend dipisahkan koma, tanpa
    // trailing slash. Contoh: https://clinic.medicore.id,https://app.example.id
    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('CORS_ALLOWED_ORIGINS', 'https://medicore-clinic.vercel.app')),
    ))),

    'allowed_origins_patterns' => [
        '#^http://localhost:[0-9]+$#',
        '#^http://127\.0\.0\.1:[0-9]+$#',
        '#^http://192\.168\.[0-9]+\.[0-9]+:[0-9]+$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
