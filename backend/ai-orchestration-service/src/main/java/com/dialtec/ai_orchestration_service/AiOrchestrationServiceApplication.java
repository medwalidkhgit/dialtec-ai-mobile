package com.dialtec.ai_orchestration_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.retry.annotation.EnableRetry;

@SpringBootApplication
@EnableFeignClients
@EnableRetry
public class AiOrchestrationServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(AiOrchestrationServiceApplication.class, args);
	}
}