package com.gamegrid.auction.service;

import com.gamegrid.auction.dto.BidRequest;
import com.gamegrid.auction.dto.BidResponse;
import com.gamegrid.auction.entity.*;
import com.gamegrid.auction.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BiddingServiceTest {

    @Mock
    private AuctionRepository auctionRepository;
    @Mock
    private AuctionTeamRepository auctionTeamRepository;
    @Mock
    private AuctionPlayerRepository auctionPlayerRepository;
    @Mock
    private BidRepository bidRepository;

    @InjectMocks
    private BiddingService biddingService;

    private Auction auction;
    private Player player;
    private AuctionPlayer auctionPlayer;
    private AuctionTeam team;

    @BeforeEach
    void setUp() {
        auction = Auction.builder()
                .id(1L)
                .auctionName("Summer League")
                .eventName("Badminton Cup")
                .category("Badminton")
                .minimumBid(BigDecimal.valueOf(1000))
                .bidIncrement(BigDecimal.valueOf(500))
                .status(AuctionStatus.Active)
                .isDeleted(false)
                .build();

        player = Player.builder()
                .id(1L)
                .name("Lin Dan")
                .category("Badminton")
                .build();

        auctionPlayer = AuctionPlayer.builder()
                .id(1L)
                .auction(auction)
                .player(player)
                .basePrice(BigDecimal.valueOf(1000))
                .status(PlayerStatus.Available)
                .build();

        team = AuctionTeam.builder()
                .id(1L)
                .auction(auction)
                .teamName("Team A")
                .purseAmount(BigDecimal.valueOf(10000))
                .remainingPurse(BigDecimal.valueOf(10000))
                .minimumPlayers(5)
                .maximumPlayers(8)
                .build();
    }

    @Test
    void placeBid_success_firstBid() {
        BidRequest request = new BidRequest(1L, 1L, 1L, BigDecimal.valueOf(1000));

        when(auctionPlayerRepository.findByAuctionIdAndPlayerIdForUpdate(1L, 1L)).thenReturn(Optional.of(auctionPlayer));
        when(auctionTeamRepository.findById(1L)).thenReturn(Optional.of(team));
        when(auctionPlayerRepository.findByTeamId(1L)).thenReturn(new ArrayList<>());
        when(bidRepository.findTopByAuctionIdAndPlayerIdOrderByBidAmountDesc(1L, 1L)).thenReturn(Optional.empty());
        when(bidRepository.save(any(Bid.class))).thenAnswer(invocation -> {
            Bid b = invocation.getArgument(0);
            b.setId(100L);
            return b;
        });

        BidResponse response = biddingService.placeBid(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals(BigDecimal.valueOf(1000), response.getBidAmount());
        verify(bidRepository, times(1)).save(any(Bid.class));
    }

    @Test
    void placeBid_fails_whenBidTooLow() {
        BidRequest request = new BidRequest(1L, 1L, 1L, BigDecimal.valueOf(800));

        when(auctionPlayerRepository.findByAuctionIdAndPlayerIdForUpdate(1L, 1L)).thenReturn(Optional.of(auctionPlayer));
        when(auctionTeamRepository.findById(1L)).thenReturn(Optional.of(team));
        when(auctionPlayerRepository.findByTeamId(1L)).thenReturn(new ArrayList<>());
        when(bidRepository.findTopByAuctionIdAndPlayerIdOrderByBidAmountDesc(1L, 1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> biddingService.placeBid(request));
        verify(bidRepository, never()).save(any(Bid.class));
    }

    @Test
    void placeBid_fails_whenBudgetExceeded() {
        BidRequest request = new BidRequest(1L, 1L, 1L, BigDecimal.valueOf(12000));

        when(auctionPlayerRepository.findByAuctionIdAndPlayerIdForUpdate(1L, 1L)).thenReturn(Optional.of(auctionPlayer));
        when(auctionTeamRepository.findById(1L)).thenReturn(Optional.of(team));
        when(auctionPlayerRepository.findByTeamId(1L)).thenReturn(new ArrayList<>());

        assertThrows(IllegalStateException.class, () -> biddingService.placeBid(request));
        verify(bidRepository, never()).save(any(Bid.class));
    }
}
