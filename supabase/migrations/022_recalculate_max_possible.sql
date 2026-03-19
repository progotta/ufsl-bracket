CREATE OR REPLACE FUNCTION recalculate_max_possible_for_game(
  p_loser_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_bracket RECORD;
  v_game RECORD;
  v_slug TEXT;
  v_new_max INTEGER;
  v_picked_team_id UUID;
BEGIN
  FOR v_bracket IN
    SELECT id, picks, score
    FROM brackets
    WHERE picks IS NOT NULL
  LOOP
    v_new_max := v_bracket.score;

    FOR v_game IN
      SELECT g.id, g.round, g.region, g.game_number, g.status,
             g.team1_id, g.team2_id, g.winner_id
      FROM games g
      WHERE g.status != 'completed'
    LOOP
      -- Derive slug with round offsets: DB game_number → pick-slug game number
      v_slug := CASE
        WHEN v_game.round = 6 THEN 'championship-r6-g1'
        WHEN v_game.round = 5 THEN 'ff-r5-g' || (v_game.game_number - 60)
        WHEN v_game.round = 4 THEN lower(v_game.region) || '-r4-g' || (v_game.game_number - 56)
        WHEN v_game.round = 3 THEN lower(v_game.region) || '-r3-g' || (v_game.game_number - 48)
        WHEN v_game.round = 2 THEN lower(v_game.region) || '-r2-g' || (v_game.game_number - 32)
        ELSE lower(v_game.region) || '-r' || v_game.round || '-g' || v_game.game_number
      END;

      -- Safely extract picked team ID from JSONB
      BEGIN
        v_picked_team_id := (v_bracket.picks->>v_slug)::UUID;
      EXCEPTION WHEN others THEN
        v_picked_team_id := NULL;
      END;

      IF v_picked_team_id IS NULL THEN CONTINUE; END IF;

      -- Skip if picked team is eliminated (lost a completed game)
      IF EXISTS (
        SELECT 1 FROM games
        WHERE status = 'completed'
        AND (team1_id = v_picked_team_id OR team2_id = v_picked_team_id)
        AND winner_id != v_picked_team_id
      ) THEN
        CONTINUE;
      END IF;

      v_new_max := v_new_max + CASE v_game.round
        WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 4
        WHEN 4 THEN 8 WHEN 5 THEN 16 WHEN 6 THEN 32
        ELSE 0 END;
    END LOOP;

    UPDATE brackets SET max_possible_score = v_new_max WHERE id = v_bracket.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
