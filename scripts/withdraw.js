const { ethers } = require("hardhat")

async function main() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    // const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContractAt("FundMe", deployer)
    console.log(`Got contract FundMe at ${fundMe.target}`)
    console.log("Withdrawing from contract...")
    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait(1)
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
