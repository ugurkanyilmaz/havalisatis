<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
if (!empty($_SESSION['admin_user'])) {
    echo json_encode(['logged_in' => true, 'user' => $_SESSION['admin_user']]);
} else {
    echo json_encode(['logged_in' => false]);
}
