<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => view('welcome'));
Route::get('/api/health', fn () => response()->json(['status' => 'ok', 'app' => 'rentOS']));
