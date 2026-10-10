package io.github.bigbeartk.gardenofhabits;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // WebView mặc định phóng chữ theo cỡ chữ hệ thống: nút tròn, ô lịch, bảng tuần sẽ vỡ.
        // Giữ 100% để bố cục giống hệt bản iPhone.
        bridge.getWebView().getSettings().setTextZoom(100);
    }
}
