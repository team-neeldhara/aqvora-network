package com.aquora.mysql_backend.controller;

import com.aquora.mysql_backend.service.GovernmentService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/government")
@CrossOrigin(origins = "*")
public class GovernmentController {

    private final GovernmentService service;

    public GovernmentController(
            GovernmentService service) {

        this.service = service;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {

        return service.getSummary();
    }

    @GetMapping("/borewells")
    public List<Map<String, Object>> borewells() {

        return service.getBorewells();
    }

    @GetMapping("/borewells/locations")
    public List<Map<String, Object>> locations() {

        return service.getLocations();
    }

    @GetMapping("/water-level-trend")
    public List<Map<String, Object>> waterLevelTrend() {

        return service.getWaterLevelTrend();
    }

    @GetMapping("/alerts")
    public List<Map<String, Object>> alerts() {

        return service.getAlerts();
    }

    @GetMapping("/grid")
    public List<Map<String, Object>> grid() {

        return service.getGrid();
    }
}