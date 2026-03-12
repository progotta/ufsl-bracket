-- Batch score recalculation: replaces the N+1 loop in /api/games POST
-- Updates all brackets with a correct pick for the given game in a single query.

CREATE OR REPLACE FUNCTION recalculate_scores_for_game(
  p_game_id TEXT,
  p_winner_id TEXT,
  p_round_points INT DEFAULT 1
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  affected INT;
BEGIN
  UPDATE brackets
  SET score = COALESCE(score, 0) + p_round_points
  WHERE picks ->> p_game_id = p_winner_id;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
