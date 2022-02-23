const { Client, AccountId, PrivateKey, FileCreateTransaction, Hbar, FileAppendTransaction,
    TransferTransaction, FileContentsQuery, Status, Duration, TokenId,
    ContractCreateTransaction, ContractFunctionParameters, ContractExecuteTransaction, ContractCallQuery, FileId, TransactionReceipt, ContractId } = require("@hashgraph/sdk");
require("dotenv").config();

const path = require('path');
const fs = require("fs");
const { exit } = require("process");

const myAccountId = AccountId.fromString(process.env.HPACCOUNTID);
const myPrivateKey = PrivateKey.fromString(process.env.HPPRIVATEKEY);

const feeToSetterId = AccountId.fromString(process.env.FEETOSETTER_ID_HP);
const feeToSetterPrivateKey = PrivateKey.fromString(process.env.FEETOSETTER_PRIVATEKEY_HP);

const abtreasuryId = AccountId.fromString(process.env.MOCK_TOKEN_OWNERID_HP);
const abtreasuryPrivateKey = PrivateKey.fromString(process.env.MOCK_TOKEN_PRIVATEKEY_HP);

const feeToId = AccountId.fromString(process.env.FEETO_ID_HP);
const tokenA = TokenId.fromString(process.env.TOKENA_HP);
const tokenB = TokenId.fromString(process.env.TOKENB_HP);
const lptoken = TokenId.fromString(process.env.LPTOKEN_HP);

const client = Client.forPreviewnet().setOperator(myAccountId, myPrivateKey);
const clientfts = Client.forPreviewnet().setOperator(feeToSetterId, feeToSetterPrivateKey);
const clientTreasuryAB = Client.forPreviewnet().setOperator(abtreasuryId, abtreasuryPrivateKey);

/**
 * Upload the specified bytecode to the file service and then create the contract with the specified arguments
 * 
 * @param {*} contractBc hex string representing compiled bytecode
 * @param  {...any} args arguments in order of contract constructor arguments
 * @returns 
 */
async function uploadContract(contractBc, ...args) {
    
    //Create a file on Hedera and store the hex-encoded bytecode
    const fileCreateTx = new FileCreateTransaction().setKeys([myPrivateKey]);
    const fileSubmit = await fileCreateTx.execute(client);
    const fileCreateRx = await fileSubmit.getReceipt(client);
    const bytecodeFileId = fileCreateRx.fileId;
    console.log(`- The smart contract bytecode file ID is: ${bytecodeFileId}`);

    let i = 0;
    let chunkSize = 4096;

    // Iterate in 4096 chunks and append to the file
    for(i = 0; i < contractBc.length; i += chunkSize) {
        // Append the contents to each file
        const fileAppendTx = new FileAppendTransaction()
        .setFileId(bytecodeFileId)
        .setContents(contractBc.slice(i, i+chunkSize))
        .setMaxTransactionFee(new Hbar(15))
        .setChunkSize(chunkSize)
        .freezeWith(client);

        const fileAppendSigned = await fileAppendTx.sign(myPrivateKey);
        const fileAppendSubmit = await fileAppendSigned.execute(client);
        const fileAppendRx = await fileAppendSubmit.getReceipt(client);
        console.log(`- Content added: ${fileAppendRx.status} \n`);
    }

    // Operator is deploying but feeToSetter comes in as constructor par
    const contractTx = new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId)
        .setGas(300000)
    
    if(args.length > 0) {
        // NOTE: THIS IS ONLY ADDING ADDRESSES AN IMPROVEMENT IS TO SPECIFY AND PARSE EACH TYPE AND ADD THEM TO THE PARAMETERS
        params = new ContractFunctionParameters();
        for(i = 0; i < args.length; i++) {
            params.addAddress(args[i]);
        }
        contractTx.setConstructorParameters(params);
    }
        

    const contractResponse = await contractTx.execute(client);
    const contractReceipt = await contractResponse.getReceipt(client);
    const factoryContractId = contractReceipt.contractId;

    //Log the smart contracconst path = require('path'); ID
    console.log("The contract ID is " + factoryContractId);

    return factoryContractId
}

/**
 * Get the bytecode from a compiled contract json file
 * 
 * @param {string} filePath 
 * @returns bytecode string with the first to characters omitted (0x)
 */
async function getBytecode(filePath) {
    let data = fs.readFileSync(filePath);
    let j = JSON.parse(data);
    return j['bytecode'].slice(2);
}

/**
 * 
 * Get the path to the output build files from compilation
 * 
 * @param {string} inpath path containing the json files with contract byte code
 * @returns Map of file names to contract Id 
 */
async function getSuiteAddresses(inpath) {

    // Get the absolute path to the compiled contracts for the swap
    const wethPath = path.join(inpath, 'WETH.json')
    const pairPath = path.join(inpath, 'UniswapV2Pair.json')
    const factoryPath = path.join(inpath, 'UniswapV2Factory.json')
    const routerPath = path.join(inpath, 'UniswapV2Router02.json')

    // Parse the file and get the byte code
    let wethBc = await getBytecode(wethPath);
    let pairBc = await getBytecode(pairPath);
    let factoryBc = await getBytecode(factoryPath);
    let routeBc = await getBytecode(routerPath);

    // Upload the bytecode and get the contract ID
    let wethContractId = await uploadContract(wethBc);
    let pairId = await uploadContract(pairBc)
    let factoryId = await uploadContract(factoryBc, feeToSetterId.toSolidityAddress())
    let routerId = await uploadContract(routeBc, factoryId.toSolidityAddress(), wethContractId.toSolidityAddress())

    console.log("WETH: "+wethContractId)
    console.log("Uniswap v2 pair: "+ pairId)
    console.log("Uniswap v2 factory: "+factoryId)
    console.log("Uniswap v2 router: "+ routerId)
    return { "WETH.json": wethContractId,
             "UniswapV2Pair.json": pairId,
             "UniswapV2Factory.json": factoryId,
             "UniswapV2Router02.json": routerId
    }

}

async function main() {
    
    const start = new Date().getTime();
    if (myAccountId == null ||
        myPrivateKey == null) {
        throw new Error("Environment variables myAccountId and myPrivateKey must be present");
    }
    // If you need to deploy the contract, uncomment this section and pass in a build directory containing the compiled smart contracts
    //
    // if(!process.argv[2]) {
    //     console.log('\nUsage: node main.js <absolute path to build directory containing yarn compile output JSON>\n');
    //     exit();
    // }
    //
    // const inpath = process.argv[2]
    // const mapOfAddrs = await getSuiteAddresses(inpath)
    // let wethAddrStr = mapOfAddrs['WETH.json']
    // let pairAddrStr = mapOfAddrs['UniswapV2Pair.json']
    // let factoryAddrStr = mapOfAddrs['UniswapV2Factory.json']
    // let routerAddrStr = mapOfAddrs['UniswapV2Router02.json']
    //

    // These addresses are on previewnet already, use these if you don't want to upload
    let wethAddrStr = ContractId.fromString("0.0.42476")
    let pairAddrStr = ContractId.fromString("0.0.42478")
    let factoryAddrStr = ContractId.fromString("0.0.42480")
    let routerAddrStr = ContractId.fromString("0.0.42482")
}

main();
