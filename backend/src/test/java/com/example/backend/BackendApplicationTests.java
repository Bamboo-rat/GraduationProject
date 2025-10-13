package com.example.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")  // Sử dụng application-test.properties
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
