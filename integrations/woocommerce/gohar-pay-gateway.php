<?php
/**
 * Plugin Name: Gohar Pay Gateway
 * Description: WooCommerce gateway that creates a Gohar Pay order and waits for confirmation webhook.
 * Version: 0.1.0
 * Author: Gohar Pay
 * Requires PHP: 7.4
 * WC requires at least: 6.0
 */
if (!defined('ABSPATH')) exit;

add_action('plugins_loaded', function () {
    if (!class_exists('WC_Payment_Gateway')) return;

    class WC_Gateway_GoharPay extends WC_Payment_Gateway {
        public function __construct() {
            $this->id = 'goharpay';
            $this->method_title = 'Gohar Pay (المحافظ + InstaPay)';
            $this->method_description = 'تأكيد تلقائي من إشعارات SMS عبر منصة جوهر باي.';
            $this->has_fields = false;
            $this->init_form_fields();
            $this->init_settings();
            $this->title = $this->get_option('title');
            $this->description = $this->get_option('description');
            add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        }

        public function init_form_fields() {
            $this->form_fields = array(
                'enabled' => array('title' => 'تفعيل', 'type' => 'checkbox', 'default' => 'yes'),
                'title' => array('title' => 'الاسم', 'type' => 'text', 'default' => 'الدفع بالمحفظة (جوهر باي)'),
                'description' => array('title' => 'الوصف', 'type' => 'textarea', 'default' => 'حوّل المبلغ من محفظتك واستقبل تأكيد فوري.'),
                'api_key' => array('title' => 'API Key', 'type' => 'text'),
                'api_url' => array('title' => 'API URL', 'type' => 'text', 'default' => 'https://api.goharpay.com/v1'),
                'webhook_secret' => array('title' => 'Webhook Secret', 'type' => 'text'),
            );
        }

        public function process_payment($order_id) {
            $order = wc_get_order($order_id);
            $resp = wp_remote_post(trailingslashit($this->get_option('api_url')) . 'orders', array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $this->get_option('api_key'),
                    'Content-Type' => 'application/json',
                ),
                'body' => wp_json_encode(array(
                    'external_ref' => 'WC-' . $order_id,
                    'amount' => floatval($order->get_total()),
                    'customer_label' => $order->get_formatted_billing_full_name(),
                    'expires_in_minutes' => 30,
                )),
                'timeout' => 15,
            ));
            if (is_wp_error($resp)) {
                wc_add_notice('فشل إنشاء طلب الدفع: ' . $resp->get_error_message(), 'error');
                return;
            }
            $order->update_status('on-hold', 'بانتظار تأكيد الدفع من جوهر باي.');
            $order->reduce_order_stock();
            WC()->cart->empty_cart();
            return array('result' => 'success', 'redirect' => $this->get_return_url($order));
        }
    }

    add_filter('woocommerce_payment_gateways', function ($g) {
        $g[] = 'WC_Gateway_GoharPay';
        return $g;
    });
});

// Webhook receiver: /?goharpay_webhook=1
add_action('init', function () {
    if (!isset($_GET['goharpay_webhook'])) return;
    $body = file_get_contents('php://input');
    $sig = isset($_SERVER['HTTP_X_GOHAR_SIGNATURE']) ? $_SERVER['HTTP_X_GOHAR_SIGNATURE'] : '';
    $settings = get_option('woocommerce_goharpay_settings');
    $secret = $settings['webhook_secret'] ?? '';
    $expected = 'sha256=' . hash_hmac('sha256', $body, $secret);
    if (!hash_equals($expected, $sig)) { status_header(401); exit('bad signature'); }
    $payload = json_decode($body, true);
    if (($payload['event'] ?? '') === 'payment.confirmed') {
        $ref = $payload['data']['matched_order'] ?? '';
        if (strpos($ref, 'WC-') === 0) {
            $order_id = intval(substr($ref, 3));
            $order = wc_get_order($order_id);
            if ($order) $order->payment_complete($payload['data']['transaction_id'] ?? '');
        }
    }
    status_header(200); exit('ok');
});
