
DROP TABLE IF EXISTS redeem_codes;
CREATE TABLE IF NOT EXISTS redeem_codes (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "communitySlug" text,
    "chainId" integer,
    "tokenAddress" text,
    "tokenSymbol" text,
    "tokenDecimals" integer,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "validFrom" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "validUntil" timestamp with time zone,
    code text,
    amount integer,
    status text,
    quantity integer DEFAULT 1,
    remaining integer DEFAULT 1,
    description text,
    "txHash" text,
    "faucetAddress" text,
    "faucetType" text,
    "encryptedPrivateKey" text
);
COMMENT ON COLUMN redeem_codes."tokenAddress" IS 'address of the smart contract';
COMMENT ON COLUMN redeem_codes.status IS 'EMPTY, FUNDED, ACTIVE, EXPIRED, REDEEMED';
COMMENT ON COLUMN redeem_codes.quantity IS '-1 for unlimited';
COMMENT ON COLUMN redeem_codes.amount IS 'in the number of decimals of the tokenAddress';
COMMENT ON COLUMN redeem_codes."faucetAddress" IS 'address to send tokens to. Can be EOA in which case it has to be able to pay gas fees, or an ERC4337 account address linked to a paymaster.';
COMMENT ON COLUMN redeem_codes."faucetType" IS 'EOA or ERC4337';

-- Indices -------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS redeem_codes_pkey ON redeem_codes(id int4_ops);
CREATE INDEX IF NOT EXISTS redeem_codes_code ON redeem_codes(code text_ops);
CREATE INDEX IF NOT EXISTS "redeem_codes_communitySlug" ON redeem_codes("communitySlug" text_ops);

DROP TABLE IF EXISTS blockchain_events;
CREATE TABLE IF NOT EXISTS blockchain_events (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "communitySlug" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    event text,
    processor character varying(32),
    processor_id text,
    amount integer,
    currency character(3),
    "accountAddress" text,
    chain character varying(64),
    signature text,
    "txHash" text,
    data json,
    fees integer
);
COMMENT ON COLUMN blockchain_events.event IS 'E.g. transfer, mint, burn';
COMMENT ON COLUMN blockchain_events.processor IS 'E.g. stripe';
COMMENT ON COLUMN blockchain_events.processor_id IS 'E.g. cs_test_a1guOeGCYg95ixgaTRu4Irf5UbxokDSldzjnPmxT38AYcYMpFRFF8UMF4A';
COMMENT ON COLUMN blockchain_events.amount IS 'Amount in cents';
COMMENT ON COLUMN blockchain_events.currency IS 'E.g. USD, EUR';
COMMENT ON COLUMN blockchain_events."accountAddress" IS 'E.g. 0x5d9c40ec843ec9622d8731c7270b3c6ad0d7cd11';
COMMENT ON COLUMN blockchain_events.chain IS 'E.g. polygon, celo';
COMMENT ON COLUMN blockchain_events."txHash" IS 'E.g. 0x9bcffdd42a8eb23a8cee99c5b6ec4494bef5b9985af8f04503e820f9e6096da6';


-- Indices -------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS mint_events_pkey ON blockchain_events(id int4_ops);

