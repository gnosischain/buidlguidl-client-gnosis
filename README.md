# 📡 BuidlGuidl Client Gnosis
This project will download client executables, start a execution + consensus client pair, and provide a terminal dashboard view of client and machine info.

## Dependencies
For Linux & MacOS:
- node (https://nodejs.org/en)
- yarn (https://yarnpkg.com/migration/overview)
- GNU Make (https://www.gnu.org/software/make/)

Additional MacOS Specifics:
- gnupg (https://gnupg.org/)
- Perl-Digest-SHA (https://metacpan.org/pod/Digest::SHA)

Hint: You can also run the dependencies script (dependencies.sh) to install all the dependencies automatically.
```bash
./dependencies.sh
```

## Quickstart
To get a full node started using a Reth + Lighthouse client pair:
  ```bash
  git clone https://github.com/gnosischain/buidlguidl-client-gnosis.git
  cd buidlguidl-client-gnosis
  yarn install
  node index.js
  ```


> **Info:**
> By default, the setup uses a combination of geth and lighthouse clients, more support for other clients will be added soon.

By default, client executables, databases, and logs will be established within buidlguidl-client/ethereum_clients. After initialization steps, the script displays a terminal view with scrolling client logs and some plots showing some machine and chain stats. Full client logs are located in buidlguidl-client/ethereum_clients/reth/logs and buidlguidl-client/ethereum_clients/lighthouse/logs. Exiting the terminal view (control-c or q) will also gracefully close your clients (can take 15 seconds or so).

&nbsp;

## Startup Options

Use the --archive flag to perform an archive sync for the execution client:
  ```bash
  node index.js --archive
  ```

Omitting the --archive flag will make the execution clients perform a pruned sync that will give you full access to data from the last 10,064 blocks for Reth or the last 128 blocks for Geth.

&nbsp;
&nbsp;

You can opt in to the BuidlGuidl distributed RPC system and earn credits for serving RPC requests to the BuidlGuidl network by passing your eth address to the --owner (-o) option:
  ```bash
  node index.js --owner <your ENS name or eth address>
  ```

&nbsp;
&nbsp;

If you want to specify a non-standard location for the ethereum_clients directory, pass a --directory (-d) option to index.js:
  ```bash
  node index.js --directory path/for/directory/containing/ethereum_clients
  ```

&nbsp;
&nbsp;

If you want to use a Geth + Lighthouse client pair, pass those as --executionclient (-e) and --consensusclient (-c) options to index.js:
  ```bash
  node index.js --executionclient geth --consensusclient lighthouse
  ```

&nbsp;
&nbsp;

Pass the --update option to update the execution and consensus clients to the latest versions (that have been tested with the BG Client):
  ```bash
  node index.js --update
  ```

&nbsp;
&nbsp;

Use the --help (-h) option to see all command line options:
  ```bash
  node index.js --help

  -e, --executionclient <client>            Specify the execution client ('reth' or 'geth')
                                            Default: reth

  -c, --consensusclient <client>            Specify the consensus client ('lighthouse' or 'prysm')
                                            Default: lighthouse

       --archive                            Perform an archive sync for the execution client

  -ep, --executionpeerport <port>           Specify the execution peer port (must be a number)
                                            Default: 30303

  -cp, --consensuspeerports <port>,<port>   Specify the execution peer ports (must be two comma-separated numbers)
                                            lighthouse defaults: 9000,9001. prysm defaults: 12000,13000

  -cc, --consensuscheckpoint <url>          Specify the consensus checkpoint server URL
                                            Lighthouse default: https://mainnet-checkpoint-sync.stakely.io/
                                            Prysm default: https://mainnet-checkpoint-sync.attestant.io/

  -d, --directory <path>                    Specify ethereum client executable, database, and logs directory
                                            Default: buidlguidl-client/ethereum_clients

  -o, --owner <eth address>                 Specify a owner eth address to opt in to the points system and distributed RPC network

      --update                              Update the execution and consensus clients to the latest version.
                                            Latest versions: Reth: 1.0.0, Geth: 1.14.12, Lighthouse: 5.3.0, (Prysm is handled by its executable automatically)

  -h, --help                                Display this help message and exit
  ```

## Debugging
For any debugging logs, you can checkout debug.log in the primary directory.

## Thanks
Special thanks for the [BuildGuild team](https://buidlguidl.com/) for starting this initiative. If you also want to run an ethereum node, check the original client [here](https://github.com/BuidlGuidl/buidlguidl-client). 
