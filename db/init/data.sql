-- Spieler
INSERT INTO users (id, name, username, "passwordHash", role) VALUES
  ('8ouu6z9z1', 'Luca', 'luca', 'd70f47790f689414789eeff231703429c7f88a10210775906460edbf38589d90', 'player'),
  ('idl0k1rw5', 'Seb', 'seb', '155290511d5c4bfb1369217d6846c8eef1ed6a564579516eaf36cf5598ac92de', 'player'),
  ('4z4bch1dt', 'BJ', 'bj', '652742992acbaf9a5a3fbef60f7a51e853a93534fac251e375c662d6a5cd8d01', 'admin'),
  ('7oxoq18uz', 'Jens', 'jens', 'ff38d2567b8123d1144a15ea77d969f1e742a8bdcd7f31c48a7cfdf4c4037663', 'player'),
  ('xl3jdapud', 'Oskar', 'oskar', 'bd558de5f79457674f54616c88955a0d4324d6173cceeaf7e47dde59cfa8cb21', 'player'),
  ('9uvjuud71', 'Leo', 'leo', '8535e86c8118bbbb0a18ac72d15d3a2b37b18d1bce1611fc60165f322cf57386', 'player'),
  ('l8z0fjukn', 'Noah', 'noah', 'cf3a3bbe331c3950d16a8e9917c5bb8340e7c0ef917da25d4a96f92d074bce05', 'player'),
  ('mxrty0x6m', 'Julian', 'julian', 'ce0fee7e61f9c74f1110f0e5940a80b4f059f189217d0c3d26bb41960d4bf597', 'player'),
  ('93hmsiv8b', 'Louis', 'louis', '5f16795c54ab7de419edf8e9c6da6065f7dd448f122fcbc9815c67daa566ba8e', 'player'),
  ('vws3r4h7i', 'Andi', 'andi', '180348f5b22db17be014d5c1cb8151c858267cb44819e5460a7ae2528b91680e', 'player'),
  ('dhcmob6mz', 'Pati', 'pati', 'f30ca884f9821c550e5e8e8c10717cd30deff1127d4197ddd33125fc453d29a3', 'player');

-- Teams
INSERT INTO teams (id, name) VALUES ('arrdmzk9r', 'Der Schöne und das Biest');
INSERT INTO team_members (id, team_id, user_id) VALUES ('arrdmzk9r_1', 'arrdmzk9r', 'l8z0fjukn'),('arrdmzk9r_2', 'arrdmzk9r', '8ouu6z9z1');
INSERT INTO teams (id, name) VALUES ('gzadppcvy', 'Paderborner Indervernascher');
INSERT INTO team_members (id, team_id, user_id) VALUES ('gzadppcvy_1', 'gzadppcvy', '7oxoq18uz'),('gzadppcvy_2', 'gzadppcvy', 'mxrty0x6m');
INSERT INTO teams (id, name) VALUES ('qbrpr5ahe', 'Bandi');
INSERT INTO team_members (id, team_id, user_id) VALUES ('qbrpr5ahe_1', 'qbrpr5ahe', '4z4bch1dt'),('qbrpr5ahe_2', 'qbrpr5ahe', 'vws3r4h7i');
INSERT INTO teams (id, name) VALUES ('4vlubnxkp', 'Two Girls One Cup');
INSERT INTO team_members (id, team_id, user_id) VALUES ('4vlubnxkp_1', '4vlubnxkp', 'xl3jdapud'),('4vlubnxkp_2', '4vlubnxkp', '93hmsiv8b');
INSERT INTO teams (id, name) VALUES ('q8kink268', 'Biervernichter');
INSERT INTO team_members (id, team_id, user_id) VALUES ('q8kink268_1', 'q8kink268', 'idl0k1rw5'),('q8kink268_2', 'q8kink268', 'dhcmob6mz');

-- Spiele
INSERT INTO games (id, name, description) VALUES ('p22vc24m2', 'Bierpong', '6 Becher');
INSERT INTO games (id, name, description) VALUES ('goip3j584', 'Flunkyball', '1 Bier pro Person');
INSERT INTO games (id, name, description) VALUES ('k3d37w0zi', 'Kastenrennen', '1 Bier pro Person');
INSERT INTO games (id, name, description) VALUES ('2wib896t3', 'BIG Pong', 'Bierpong auf dem Rasen');

-- Ergebnisse
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('s6x3ckng6', 'p22vc24m2', 'q8kink268', '4vlubnxkp', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('zg2a4ktsc', 'goip3j584', 'gzadppcvy', 'qbrpr5ahe', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('ucau0wo62', 'p22vc24m2', 'arrdmzk9r', '4vlubnxkp', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('36q85e93j', '2wib896t3', 'qbrpr5ahe', 'q8kink268', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('feg66tav2', '2wib896t3', 'q8kink268', 'arrdmzk9r', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('zp8dke8v9', 'p22vc24m2', 'gzadppcvy', '4vlubnxkp', 0, 1);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('uflgbitps', 'goip3j584', 'arrdmzk9r', 'qbrpr5ahe', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('zf1lxxw3v', '2wib896t3', 'qbrpr5ahe', '4vlubnxkp', 0, 1);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('0a6vx8j5t', 'p22vc24m2', 'q8kink268', 'gzadppcvy', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('wen6xwj68', 'p22vc24m2', 'qbrpr5ahe', 'arrdmzk9r', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('u2c9r6l4u', '2wib896t3', 'gzadppcvy', '4vlubnxkp', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('j37oul8q4', 'k3d37w0zi', 'gzadppcvy', 'qbrpr5ahe', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('irg3hkv2m', 'p22vc24m2', 'q8kink268', 'arrdmzk9r', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('ad63a2zte', 'goip3j584', 'qbrpr5ahe', '4vlubnxkp', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('7ed69enq9', 'goip3j584', '4vlubnxkp', 'q8kink268', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('z7kb2zmdw', 'p22vc24m2', 'gzadppcvy', 'arrdmzk9r', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('3fu6rilxo', 'k3d37w0zi', 'gzadppcvy', 'arrdmzk9r', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('3v1x689r2', 'p22vc24m2', 'q8kink268', 'qbrpr5ahe', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('chzhsjzas', 'goip3j584', 'arrdmzk9r', 'gzadppcvy', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('k0jktj4ou', '2wib896t3', 'arrdmzk9r', '4vlubnxkp', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('qa1hjzauw', 'k3d37w0zi', '4vlubnxkp', 'q8kink268', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('uaw8m2h2f', 'p22vc24m2', 'qbrpr5ahe', 'gzadppcvy', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('qy4nl4ljz', 'k3d37w0zi', 'gzadppcvy', 'q8kink268', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('j8if9vdrd', 'k3d37w0zi', 'qbrpr5ahe', 'q8kink268', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('i2sl08x4v', 'goip3j584', '4vlubnxkp', 'gzadppcvy', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('ns8ob2btj', '2wib896t3', 'qbrpr5ahe', 'arrdmzk9r', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('8ryd9lzg3', '2wib896t3', 'q8kink268', '4vlubnxkp', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('9ivki9d4v', 'k3d37w0zi', 'qbrpr5ahe', 'arrdmzk9r', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('8342udo1g', 'k3d37w0zi', 'qbrpr5ahe', '4vlubnxkp', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('wqxht9ly3', 'goip3j584', 'arrdmzk9r', 'q8kink268', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('ksvk3tnvr', 'goip3j584', 'arrdmzk9r', '4vlubnxkp', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('is8dgtny8', '2wib896t3', 'qbrpr5ahe', 'gzadppcvy', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('i14mkeu14', '2wib896t3', 'gzadppcvy', 'q8kink268', 0, 1);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('zrsqeokd8', 'p22vc24m2', 'qbrpr5ahe', '4vlubnxkp', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('6dcxju22h', 'goip3j584', 'gzadppcvy', 'q8kink268', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('g6hlsws97', 'goip3j584', 'qbrpr5ahe', 'q8kink268', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('3ewouh13s', 'k3d37w0zi', 'arrdmzk9r', '4vlubnxkp', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('1gh8hknnv', 'k3d37w0zi', 'q8kink268', 'arrdmzk9r', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('zhszno968', '2wib896t3', 'gzadppcvy', 'arrdmzk9r', 1, 0);
INSERT INTO match_results (id, game_id, team1_id, team2_id, team1_score, team2_score) VALUES ('00j8xps0o', 'k3d37w0zi', 'gzadppcvy', '4vlubnxkp', 1, 0);