package com.aquora.mysql_backend.websocket;

import com.aquora.mysql_backend.dto.BorewellReadingResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component 
public class BorewellWebSocketHandler extends TextWebSocketHandler {
    
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet(); 
    private final ObjectMapper mapper;

    public BorewellWebSocketHandler(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override 
    public void afterConnectionEstablished(WebSocketSession s) {
        sessions.add(s);
    }

    @Override 
    public void afterConnectionClosed(WebSocketSession s, CloseStatus status) {
        sessions.remove(s);
    }

    // THIS IS YOUR broadcast method:
    public void broadcast(BorewellReadingResponse data) {
        try {
            TextMessage msg = new TextMessage(mapper.writeValueAsString(data));
            for (WebSocketSession s : sessions) {
                if (s.isOpen()) {
                    try {
                        s.sendMessage(msg);
                    } catch (Exception e) {
                        sessions.remove(s);
                    }
                }
            }
        } catch (Exception ignored) {
        }
    }
}