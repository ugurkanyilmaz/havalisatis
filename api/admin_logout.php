<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
// Clear session auth
unset($_SESSION['admin_user']);
echo json_encode(['status' => 'ok']);
