package com.aquora.mysql_backend.config;
import com.aquora.mysql_backend.websocket.BorewellWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;
@Configuration @EnableWebSocket public class WebSocketConfig implements WebSocketConfigurer{
 private final BorewellWebSocketHandler handler; public WebSocketConfig(BorewellWebSocketHandler handler){this.handler=handler;}
 @Override public void registerWebSocketHandlers(WebSocketHandlerRegistry registry){registry.addHandler(handler,"/ws").setAllowedOriginPatterns("*");}
}
