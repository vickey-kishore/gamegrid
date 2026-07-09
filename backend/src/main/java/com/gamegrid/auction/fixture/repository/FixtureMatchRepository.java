package com.gamegrid.auction.fixture.repository;

import com.gamegrid.auction.fixture.entity.FixtureMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FixtureMatchRepository extends JpaRepository<FixtureMatch, Long> {
    List<FixtureMatch> findByEventId(Long eventId);
    List<FixtureMatch> findByEventIdOrderByRoundNumberAscMatchNumberAsc(Long eventId);
    java.util.Optional<FixtureMatch> findByEventIdAndRoundNumberAndMatchNumber(Long eventId, int roundNumber, int matchNumber);
    void deleteByEventId(Long eventId);
}
