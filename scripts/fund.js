const { ethers } = require("hardhat")

async function main() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    // const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContractAt("FundMe", deployer)
    console.log(`Got contract FundMe at ${fundMe.target}`)
    console.log("Funding contract...")
    const transactionResponse = await fundMe.fund({
        value: ethers.parseEther("0.1"),
    })
    await transactionResponse.wait(1)
    console.log("Funded!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
