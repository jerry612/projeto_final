import CarService from "@services/CarService"
import {Request, Response, NextFunction } from "express"
class CarController{

    async create(req:Request, res:Response, next: NextFunction) {
        try{
            const car = await CarService.create(req.body)
            return res.status(201).json(car)
        }
        catch(e){
            next(e)
        }
    }

    async get(req:Request, res:Response, next: NextFunction) {
        try{
            return res.status(200).send('ok')
        }
        catch(e){
            next(e)
        }
    }

    async getById(req:Request, res:Response, next: NextFunction) {
        try{
            return res.status(200).send('ok')
        }
        catch(e){
            next(e)
        }
    }

    async update(req:Request, res:Response, next: NextFunction) {
        try{
            return res.status(204).end()
        }
        catch(e){
            next(e)
        }
    }

    async delete(req:Request, res:Response, next: NextFunction) {
        try{
            return res.status(204).end()
        }
        catch(e){
            next(e)
        }
    }
}

export default new CarController()