package com.gamegrid.auction.tournament.repository;

import com.gamegrid.auction.tournament.entity.TournamentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TournamentEventRepository extends JpaRepository<TournamentEvent, Long> {
    List<TournamentEvent> findByTournamentId(Long tournamentId);
}
