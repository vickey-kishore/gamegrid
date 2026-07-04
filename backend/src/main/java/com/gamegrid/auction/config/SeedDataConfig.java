package com.gamegrid.auction.config;

import com.gamegrid.auction.entity.Player;
import com.gamegrid.auction.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SeedDataConfig implements CommandLineRunner {

    private final PlayerRepository playerRepository;

    @Override
    public void run(String... args) {
        if (playerRepository.count() > 0) {
            return; // Seed only if empty
        }

        List<Player> seedPlayers = List.of(
            // Badminton Category
            Player.builder().name("Lin Dan").phoneNumber("9876543210").email("lindan@gamegrid.com")
                    .gender("Male").age(38).category("Badminton").city("Beijing").state("China")
                    .skillLevel("Professional").build(),
            Player.builder().name("Lee Chong Wei").phoneNumber("9876543211").email("leecw@gamegrid.com")
                    .gender("Male").age(39).category("Badminton").city("Kuala Lumpur").state("Malaysia")
                    .skillLevel("Professional").build(),
            Player.builder().name("Carolina Marin").phoneNumber("9876543212").email("carolina@gamegrid.com")
                    .gender("Female").age(28).category("Badminton").city("Madrid").state("Spain")
                    .skillLevel("Professional").build(),
            Player.builder().name("PV Sindhu").phoneNumber("9876543213").email("sindhu@gamegrid.com")
                    .gender("Female").age(26).category("Badminton").city("Hyderabad").state("Telangana")
                    .skillLevel("Professional").build(),
            Player.builder().name("Viktor Axelsen").phoneNumber("9876543214").email("viktor@gamegrid.com")
                    .gender("Male").age(28).category("Badminton").city("Odense").state("Denmark")
                    .skillLevel("Professional").build(),
            Player.builder().name("Tai Tzu-ying").phoneNumber("9876543215").email("taitzu@gamegrid.com")
                    .gender("Female").age(27).category("Badminton").city("Kaohsiung").state("Taiwan")
                    .skillLevel("Professional").build(),
            Player.builder().name("Kento Momota").phoneNumber("9876543216").email("kento@gamegrid.com")
                    .gender("Male").age(27).category("Badminton").city("Kagawa").state("Japan")
                    .skillLevel("Intermediate").build(),
            Player.builder().name("An Se-young").phoneNumber("9876543217").email("anse@gamegrid.com")
                    .gender("Female").age(20).category("Badminton").city("Gwangju").state("South Korea")
                    .skillLevel("Intermediate").build(),

            // Cricket Category
            Player.builder().name("Virat Kohli").phoneNumber("9876543218").email("virat@gamegrid.com")
                    .gender("Male").age(33).category("Cricket").city("Delhi").state("Delhi")
                    .skillLevel("Professional").build(),
            Player.builder().name("Steve Smith").phoneNumber("9876543219").email("steve@gamegrid.com")
                    .gender("Male").age(32).category("Cricket").city("Sydney").state("NSW")
                    .skillLevel("Professional").build(),
            Player.builder().name("Mithali Raj").phoneNumber("9876543220").email("mithali@gamegrid.com")
                    .gender("Female").age(39).category("Cricket").city("Jodhpur").state("Rajasthan")
                    .skillLevel("Professional").build(),
            Player.builder().name("Ellyse Perry").phoneNumber("9876543221").email("ellyse@gamegrid.com")
                    .gender("Female").age(31).category("Cricket").city("Sydney").state("NSW")
                    .skillLevel("Professional").build(),
            Player.builder().name("Kane Williamson").phoneNumber("9876543222").email("kane@gamegrid.com")
                    .gender("Male").age(31).category("Cricket").city("Tauranga").state("BOP")
                    .skillLevel("Professional").build(),
            Player.builder().name("Babar Azam").phoneNumber("9876543223").email("babar@gamegrid.com")
                    .gender("Male").age(27).category("Cricket").city("Lahore").state("Punjab")
                    .skillLevel("Intermediate").build(),
            Player.builder().name("Joe Root").phoneNumber("9876543224").email("joe@gamegrid.com")
                    .gender("Male").age(31).category("Cricket").city("Sheffield").state("Yorkshire")
                    .skillLevel("Intermediate").build(),
            Player.builder().name("Smriti Mandhana").phoneNumber("9876543225").email("smriti@gamegrid.com")
                    .gender("Female").age(25).category("Cricket").city("Mumbai").state("Maharashtra")
                    .skillLevel("Intermediate").build()
        );

        playerRepository.saveAll(seedPlayers);
    }
}
