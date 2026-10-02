package com.aquora.mysql_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NeeldhaaraApplication {
    public static void main(String[] args) {
        SpringApplication.run(NeeldhaaraApplication.class, args);
    }
}
