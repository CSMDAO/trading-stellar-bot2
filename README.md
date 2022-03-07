# trading-stellar-bot2

## Stellar Routes

### Create User
Registers users to the database.

- URL:
  * `/create`

- Method:
  * `GET`

- URL Params:
  * None

- Data Params:
  * `username=[string]`
  * `publickey=[string]`
  * `privatekey=[string]`

- Success Response:
  * Code: 201
  * Content: `{ success: true, message: User added! }`

- Error Response:
  * Code: 400
  * Content: `{ success: false, message: Please enter all fields }`
  
  OR  
  
  * Code: 500
  * Content: `{ success: false, message: 'example error message blla' }`

- Sample Call:
  ```
  https://(linktoapi)/create?username=helloworld&publickey=GBANPGJBMNQWHYGE4JD765JDJZBDHHP2T4BFWTNC4UL4DM3FU3UIQACU&privatekey=SCECAXI2H5TUCGCAWHJGFLMJOGQFOOHUZVYFCPRIVATEKEYGOESHERE
  
  // => 
  {
    success: true, message: User added!
  }
  ```
  
### Get account balance
Retrieves account balance.

- URL:
  * `/balance`

- Method:
  * `GET`

- URL Params:
  * None

- Data Params:
  * `username=[string]`

- Success Response:
  * Code: 200
  * Content: `{ success: true, balance: [{ "balance":"12.6105036", "buying_liabilities":"0.0000000", "selling_liabilities":"0.0000000", "asset_type":"native"}] }`

- Error Response:
  * Code: 500
  * Content: `{ success: false, message: 'example error message blla' }`

- Sample Call:
  ```
  https://(linktoapi)/balance?username=helloworld
  
  // => 
  {
    success: true, balance: [{ "balance":"12.6105036", "buying_liabilities":"0.0000000", "selling_liabilities":"0.0000000", "asset_type":"native"}]
  }
  ```
  
## Trading Routes
  
### Get Pair Price
Retrieves the latest price for the pair.

- URL:
  * `/pairprice`

- Method:
  * `GET`

- URL Params:
  * None

- Data Params:
  * `pair=[string]`

- Success Response:
  * Code: 200
  * Content: `{ success: true, pair: {"BNBUSDT": "380.50000000"} }`

- Error Response:
  * Code: 500
  * Content: `{ success: false, message: 'example error message blla' }`

- Sample Call:
  ```
  https://(linktoapi)/pairprice?pair=BNBUSDT
  
  // => 
  {
    success: true, pair: {"BNBUSDT": "380.50000000"}
  }
  ```
  
### Buy Offer
Sends buy offer to stellar network

- URL:
  * `/buy`

- Method:
  * `POST`

- URL Params:
  * None

- Data Params:
  * `username=[string]`
  * `privatekey=[string]`
  * `sellingasset=[string]`
  * `buyingasset=[string]`
  * `amount=[string]`

- Success Response:
  * Code: 200
  * Content: `{ success: true, message: Buy Offer successfully sent! }`

- Error Response:
  * Code: 500
  * Content: `{ success: false, message: Error sending transaction, check console for more details }`

  OR  

  * Code: 500
  * Content: `{ success: false, message: 'example error message blla' }`

- Sample Call:
  ```
  https://(linktoapi)/buy?username=helloworld&privatekey=SCECAXI2H5TUCGCAWHJGFLMJOGQFOOHUZVZYFCPRIVATEKEYGOESHERE&sellingasset=USDC&buyingasset=BNB&amount=0.0001
  
  // => 
  {
    success: true, message: Buy Offer successfully sent!
  }
  ```

### Sell Offer
Sends sell offer to stellar network

- URL:
  * `/sell`

- Method:
  * `POST`

- URL Params:
  * None

- Data Params:
  * `username=[string]`
  * `privatekey=[string]`
  * `sellingasset=[string]`
  * `buyingasset=[string]`
  * `amount=[string]`

- Success Response:
  * Code: 200
  * Content: `{ success: true, message: Sell Offer successfully sent! }`

- Error Response:
  * Code: 500
  * Content: `{ success: false, message: Error sending transaction, check console for more details }`

  OR  

  * Code: 500
  * Content: `{ success: false, message: 'example error message blla' }`

- Sample Call:
  ```
  https://(linktoapi)/sell?username=helloworld&privatekey=SCECAXI2H5TUCGCAWHJGFLMJOGQFOOHUZVZYFCPRIVATEKEYGOESHERE&sellingasset=BNB&buyingasset=USDC&amount=0.0001
  
  // => 
  {
    success: true, message: Sell Offer successfully sent!
  }
  ```
