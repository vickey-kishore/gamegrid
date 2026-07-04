package com.gamegrid.auction.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gamegrid.auction.dto.AuctionRequest;
import com.gamegrid.auction.dto.TeamConfig;
import com.gamegrid.auction.entity.Player;
import com.gamegrid.auction.repository.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuctionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PlayerRepository playerRepository;

    @BeforeEach
    void setUp() {
        playerRepository.deleteAll();
        // Seed enough players for validation
        playerRepository.saveAll(List.of(
            Player.builder().name("Player A").phoneNumber("1111111111").category("Cricket").build(),
            Player.builder().name("Player B").phoneNumber("2222222222").category("Cricket").build(),
            Player.builder().name("Player C").phoneNumber("3333333333").category("Cricket").build(),
            Player.builder().name("Player D").phoneNumber("4444444444").category("Cricket").build()
        ));
    }

    @Test
    void createAuction_success() throws Exception {
        TeamConfig team1 = TeamConfig.builder()
                .teamName("Warriors")
                .purseAmount(BigDecimal.valueOf(10000))
                .minimumPlayers(1)
                .maximumPlayers(5)
                .build();
        
        TeamConfig team2 = TeamConfig.builder()
                .teamName("Knights")
                .purseAmount(BigDecimal.valueOf(10000))
                .minimumPlayers(1)
                .maximumPlayers(5)
                .build();

        AuctionRequest request = AuctionRequest.builder()
                .auctionName("Cricket Smash")
                .eventName("Championship 2026")
                .category("Cricket")
                .auctionDate(LocalDate.now())
                .minimumBid(BigDecimal.valueOf(500))
                .bidIncrement(BigDecimal.valueOf(100))
                .teams(List.of(team1, team2))
                .build();

        mockMvc.perform(post("/api/auctions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.auctionName").value("Cricket Smash"))
                .andExpect(jsonPath("$.status").value("Draft"));
    }

    @Test
    void createAuction_fails_whenNotEnoughPlayers() throws Exception {
        TeamConfig team1 = TeamConfig.builder()
                .teamName("Warriors")
                .purseAmount(BigDecimal.valueOf(10000))
                .minimumPlayers(10) // 10 min players needed but only 4 registered
                .maximumPlayers(15)
                .build();
        
        TeamConfig team2 = TeamConfig.builder()
                .teamName("Knights")
                .purseAmount(BigDecimal.valueOf(10000))
                .minimumPlayers(10)
                .maximumPlayers(15)
                .build();

        AuctionRequest request = AuctionRequest.builder()
                .auctionName("Cricket Smash Fail")
                .eventName("Championship 2026")
                .category("Cricket")
                .auctionDate(LocalDate.now())
                .minimumBid(BigDecimal.valueOf(500))
                .bidIncrement(BigDecimal.valueOf(100))
                .teams(List.of(team1, team2))
                .build();

        mockMvc.perform(post("/api/auctions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
