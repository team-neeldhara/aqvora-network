package com.aquora.mysql_backend.controller;
import com.aquora.mysql_backend.dto.BorewellReadingResponse;
import com.aquora.mysql_backend.service.BorewellService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/v1") public class BorewellController{
 private final BorewellService service; public BorewellController(BorewellService service){this.service=service;}
 @GetMapping("/health") public Map<String,String> health(){return Map.of("status","UP","service","neeldhaara-api-websocket");}
 @GetMapping("/borewells/{deviceId}/latest") public ResponseEntity<?> latest(@PathVariable String deviceId){try{return ResponseEntity.ok(service.latest(deviceId));}catch(IllegalArgumentException e){return ResponseEntity.notFound().build();}}
 @GetMapping("/borewells/{deviceId}/history") public List<BorewellReadingResponse> history(@PathVariable String deviceId,@RequestParam(defaultValue="100") int limit){return service.history(deviceId,limit);}
}
