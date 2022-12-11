# OpenSubs

OpenSubs is an NFT marketplace that enables NFT rental through the ERC-4907 standard.
By tokenizing the subscriptions of streaming platforms, OpenSubs will allow users to rent their subscriptions from peer to peer.

People without a subscription will be able to rent a subscription to have access to the platform for a given time. People with a subscription who rent it can earn passive income during the time they are not using their subscription. Streaming platforms, like OpenSubs, will receive a commission for each rental between users.

## Requirements

- Docker Compose
- Make (optional)

## Project initialization

### Environment variables

After cloning the repository

- Create `ethereum/.env` from the template `ethereum/.env.default` and fill in the values
- Create `frontend/.env` from the template `frontend/.env.default` and fill in the values

### Start development environment

Run the following command to start Docker containers:

```shell
docker compose up
```

NPM dependencies will be installed automatically.

#### Access

You should access the React application at the following URL: [http://localhost](http://localhost)

### Useful commands

#### Compile smart contracts

```shell
# With Make
make compile

# Without Make
docker compose exec hardhat npx hardhat compile
```

#### Run smart contract unit tests

```shell
# With Make
make test

# Without Make
docker compose exec hardhat npx hardhat test --network localhost
```

#### Get test coverage

```shell
# With Make
make coverage

# Without Make
docker compose exec hardhat npx hardhat coverage --network hardhat
```

#### Deploy contracts

##### On hardhat local blockchain

```shell
# With Make
make run

# Without Make
docker compose exec hardhat npx hardhat run ./scripts/deploy.ts --network localhost
```

##### On testnet/mainnet

```shell
# With Make
make run NETWORK=<network>

# Without Make
docker compose exec hardhat npx hardhat run ./scripts/deploy.ts --network <network>
```

#### Start hardhat console

```shell
# With Make
make console

# Without Make
docker compose exec hardhat npx hardhat console --network localhost
```
