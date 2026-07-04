package com.gamegrid.auction.repository;

import com.gamegrid.auction.entity.AuctionPlayer;
import com.gamegrid.auction.entity.PlayerStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionPlayerRepository extends JpaRepository<AuctionPlayer, Long>, JpaSpecificationExecutor<AuctionPlayer> {
    List<AuctionPlayer> findByAuctionId(Long auctionId);
    
    @Query("SELECT ap FROM AuctionPlayer ap JOIN FETCH ap.player WHERE ap.auction.id = :auctionId")
    List<AuctionPlayer> findByAuctionIdWithPlayerDetails(@Param("auctionId") Long auctionId);

    Optional<AuctionPlayer> findByAuctionIdAndPlayerId(Long auctionId, Long playerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ap FROM AuctionPlayer ap WHERE ap.auction.id = :auctionId AND ap.player.id = :playerId")
    Optional<AuctionPlayer> findByAuctionIdAndPlayerIdForUpdate(@Param("auctionId") Long auctionId, @Param("playerId") Long playerId);

    List<AuctionPlayer> findByTeamId(Long teamId);

    @Query("SELECT ap FROM AuctionPlayer ap JOIN FETCH ap.player WHERE ap.team.id = :teamId AND ap.status = 'Sold'")
    List<AuctionPlayer> findPurchasedPlayersByTeamIdWithPlayerDetails(@Param("teamId") Long teamId);

    long countByAuctionId(Long auctionId);
}
