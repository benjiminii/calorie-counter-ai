-- Custom: backfill legacy rows that predate user scoping.
UPDATE `meals` SET `user_id` = 'guest' WHERE `user_id` IS NULL;