import { InvalidValue } from "@errors/InvalidValue"
import { NotFound } from "@errors/NotFound"
import { PersonCreateModel } from "@models/PersonCreateModel"
import PersonModel from "@models/PersonModel"
import AuthenticateService from "@services/AuthenticateService"
import MongoDatabase from "../../src/infra/mongo/index"
import factory from '../utils/PeopleFactory'

MongoDatabase.connect()

describe("src :: api :: services :: authenticate", ()=>{
    beforeAll(async () => {
        await PersonModel.deleteMany()
    })
    afterAll(async () => {
        await MongoDatabase.disconect()
    })
    afterEach(async () => {
        await PersonModel.deleteMany()
    })

    it("should authenticate", async ()=>{
        const temp = await factory.create<PersonCreateModel>('People', {senha: '123456'})
        
        const result = await AuthenticateService.authenticate(temp.email, '123456')
        
        expect(result.email).toBe(temp.email)
        expect(result.habilitado).toBe(temp.habilitado)
        expect(result.token).toBeDefined()
    })

    it("should throw invalid value error when trying to authenticate", async ()=>{
        const temp = await factory.create<PersonCreateModel>('People')
        try{
            const result = await AuthenticateService.authenticate(temp.email, '123456')

        }catch(e){
            expect(e).toBeInstanceOf(InvalidValue)
            expect((<InvalidValue>e).message).toBe("O valor do campo 'senha' informado está inválido")
        }
    })

    it("should throw invalid value error when trying to authenticate", async ()=>{
        try{
            const result = await AuthenticateService.authenticate('Joazinho@mail.com', '123456')
        }catch(e){
            expect(e).toBeInstanceOf(NotFound)
            expect((<NotFound>e).message).toBe("Valor Joazinho@mail.com não encontrado")
        }
    })
})