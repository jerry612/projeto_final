/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-underscore-dangle */
import request from 'supertest';
import CarModel from '@models/CarModel';

import { generateToken } from '@services/TokenService';
import Car from '@interfaces/Car';
import factory from '../utils/CarFactory';
import MongoDatabase from '../../src/infra/mongo/index';
import app from '../../src/app';

const PREFIX = '/api/v1/car';
const carData = {
  modelo: 'GM S10 2.8',
  cor: 'Verde',
  ano: 2021,
  acessorios: [{ descricao: 'Ar-condicionado' }],
  quantidadePassageiros: 5,
};
let token = {};
describe('src :: api :: controllers :: car', () => {
  beforeAll(async () => {
    await CarModel.deleteMany();
    const key = generateToken({
      email: 'joazinho@email.com',
      habilitado: 'sim',
      id: '6171508962f47a7a91938d30',
    });

    token = { authorization: `Bearer ${key}` };
  });
  afterAll(async () => {
    await MongoDatabase.disconect();
  });
  afterEach(async () => {
    await CarModel.deleteMany();
  });

  /**
   * POST CREATE
   */

  it('should create a car', async () => {
    const response = await request(app).post(PREFIX).set(token).send(carData);

    const car = response.body;

    expect(response.status).toBe(201);
    expect(car._id).toBeDefined();
    expect(car.acessorios.length).toEqual(1);
    expect(car.ano).toBe(carData.ano);
    expect(car.__v).toBeUndefined();
    expect(car.modelo).toBe(carData.modelo);
    expect(car.cor).toBe(carData.cor);
    expect(car.quantidadePassageiros).toBe(carData.quantidadePassageiros);
  });

  it('should return 400 with errors if missing an attribute', async () => {
    const temp = {
      modelo: 'GM S10 2.8',
      ano: 2021,
      acessorios: [],
      quantidadePassageiros: 5,
    };
    const response = await request(app).post(PREFIX).set(token).send(temp);
    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('cor');
    expect(value[0].name).toBe('"cor" is required');
  });

  it('should return 400 when white spaces on descricao', async () => {
    const temp = await factory.create<Car>('Car');
    const response = await request(app)
      .post(PREFIX)
      .set(token)
      .send({
        modelo: '  ',
        ano: 2021,
        acessorios: [{ descricao: '  ' }],
        quantidadePassageiros: 5,
      });

    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('modelo');
    expect(value[0].name).toBe('"modelo" is not allowed to be empty');
  });

  it('should return 400 with errors, if has no accessory', async () => {
    const temp = {
      modelo: 'GM S10 2.8',
      cor: 'Verde',
      ano: 2021,
      acessorios: [],
      quantidadePassageiros: 5,
    };
    const response = await request(app).post(PREFIX).set(token).send(temp);
    const value = response.body;
    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('acessorios');
    expect(value[0].name).toBe('"acessorios" must contain at least 1 items');
  });

  it('should return 400 with errors if year greater than 2022', async () => {
    const temp = {
      modelo: 'GM S10 2.8',
      cor: 'Verde',
      ano: 2023,
      acessorios: [{ descricao: 'Ar-condicionado' }],
      quantidadePassageiros: 5,
    };
    const response = await request(app).post(PREFIX).set(token).send(temp);

    const value = response.body;
    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('ano');
    expect(value[0].name).toBe('"ano" must be less than or equal to 2022');
  });

  it('should return 400 with errors if year least than 1950', async () => {
    const temp = {
      modelo: 'GM S10 2.8',
      cor: 'Verde',
      ano: 1949,
      acessorios: [{ descricao: 'Ar-condicionado' }],
      quantidadePassageiros: 5,
    };
    const response = await request(app).post(PREFIX).set(token).send(temp);

    const value = response.body;
    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('ano');
    expect(value[0].name).toBe('"ano" must be greater than or equal to 1950');
  });

  it('should not include if duplicated accessory', async () => {
    const temp = {
      modelo: 'GM S10 2.8',
      cor: 'Verde',
      ano: 2021,
      acessorios: [
        { descricao: 'Ar-condicionado' },
        { descricao: 'Ar-condicionado' },
      ],
      quantidadePassageiros: 5,
    };
    const response = await request(app).post(PREFIX).set(token).send(temp);

    const value = response.body;
    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('acessorios.1');
    expect(value[0].name).toBe('"acessorios[1]" contains a duplicate value');
  });

  /**
   * GET LIST
   */

  it('should get all cars', async () => {
    const carTemp = await factory.createMany<Car>('Car', 5);

    const response = await request(app)
      .get(`${PREFIX}?offset=0&limit=${carTemp.length}`)
      .set(token);
    const vehicles = response.body;

    expect(response.status).toBe(200);
    expect(vehicles).toHaveProperty('veiculos');
    expect(vehicles.veiculos.length).toEqual(carTemp.length);
  });

  it('should get all cars by accessory', async () => {
    const carTemp = await factory.createMany<Car>('Car', 5, {
      acessorios: [{ descricao: 'Ar-condicionado' }],
    });

    const response = await request(app)
      .get(
        `${PREFIX}?offset=0&limit=${carTemp.length}&descricao=Ar-condicionado`
      )
      .set(token);
    const vehicles = response.body;

    expect(response.status).toBe(200);
    expect(vehicles).toHaveProperty('veiculos');
    expect(vehicles).toHaveProperty('total');
    expect(vehicles).toHaveProperty('limit');
    expect(vehicles).toHaveProperty('offset');
    expect(vehicles).toHaveProperty('offsets');
    expect(vehicles.veiculos.length).toEqual(carTemp.length);
    vehicles.veiculos.forEach((element: Car) => {
      expect(element.acessorios[0].descricao).toBe('Ar-condicionado');
    });
  });

  it('should get all cars by modelo', async () => {
    const carTemp = await factory.createMany<Car>('Car', 5, {
      modelo: 'GM S10 2.8',
    });
    const response = await request(app)
      .get(`${PREFIX}?modelo=${carTemp[0].modelo}`)
      .set(token);
    const vehicles = response.body;

    expect(response.status).toBe(200);
    expect(vehicles).toHaveProperty('veiculos');
    expect(vehicles).toHaveProperty('total');
    expect(vehicles).toHaveProperty('limit');
    expect(vehicles).toHaveProperty('offset');
    expect(vehicles).toHaveProperty('offsets');
    expect(vehicles.veiculos.length).toEqual(5);
  });

  it('should not get any cars when doesnt have any register for the query', async () => {
    const carTemp = await factory.createMany<Car>('Car', 5);
    const response = await request(app)
      .get(`${PREFIX}?modelo=Chevy`)
      .set(token);
    const vehicles = response.body;

    expect(response.status).toBe(200);
    expect(vehicles).toHaveProperty('veiculos');
    expect(vehicles).toHaveProperty('total');
    expect(vehicles).toHaveProperty('limit');
    expect(vehicles).toHaveProperty('offset');
    expect(vehicles).toHaveProperty('offsets');
    expect(vehicles.veiculos.length).toEqual(0);
  });

  /**
   * GET BY ID
   */

  it("should get a car by it's ID", async () => {
    const carUsed = await factory.create<Car>('Car');

    if (carUsed.id) {
      const response = await request(app)
        .get(`${PREFIX}/${carUsed.id}`)
        .set(token);
      const car = response.body;

      expect(response.status).toBe(200);
      expect(car._id).toBe(carUsed.id);
      expect(car.modelo).toBe(carUsed.modelo);
      expect(car.__v).toBeUndefined();
      expect(car.ano).toBe(carUsed.ano);
      expect(car.cor).toBe(carUsed.cor);
    } else {
      expect(carUsed.id).toBeDefined();
    }
  });

  it('should return 400 with errors if ID is invalid when searching', async () => {
    const response = await request(app).get(`${PREFIX}/12`).set(token);
    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('id');
    expect(value[0].name).toBe('"id" length must be 24 characters long');
  });

  it('should return 404 with error if ID is not found when searching', async () => {
    const response = await request(app)
      .get(`${PREFIX}/6171508962f47a7a91938d30`)
      .set(token);
    const car = response.body;

    expect(response.status).toBe(404);
    expect(car.length).toEqual(1);
    expect(car[0].description).toBe('Not Found');
    expect(car[0].name).toBe('Value 6171508962f47a7a91938d30 not found');
  });

  /**
   * DELETE BY ID
   */

  it("should remove a car by it's ID", async () => {
    const carUsed = await factory.create<Car>('Car');

    if (carUsed.id) {
      const response = await request(app)
        .delete(`${PREFIX}/${carUsed.id}`)
        .set(token);
      const car = response.body;

      expect(response.status).toBe(204);
      expect(car).toEqual({});
    } else {
      expect(carUsed.id).toBeDefined();
    }
  });

  it('should return 400 with errors if ID is invalid when removing', async () => {
    const response = await request(app).delete(`${PREFIX}/12`).set(token);
    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('id');
    expect(value[0].name).toBe('"id" length must be 24 characters long');
  });

  it('should return 404 with error if ID is notfound when removing', async () => {
    const response = await request(app)
      .delete(`${PREFIX}/6171508962f47a7a91938d30`)
      .set(token);

    const car = response.body;

    expect(response.status).toBe(404);
    expect(car.length).toEqual(1);
    expect(car[0].description).toBe('Not Found');
    expect(car[0].name).toBe('Value 6171508962f47a7a91938d30 not found');
  });

  /**
   * PUT BY ID
   */

  it('should update a car', async () => {
    const temp = await factory.create<Car>('Car');
    const response = await request(app)
      .put(`${PREFIX}/${temp.id}`)
      .set(token)
      .send(carData);
    const result = response.body;

    expect(response.status).toBe(200);
    expect(result.acessorios[0].descricao).toEqual(
      carData.acessorios[0].descricao
    );
    expect(result.__v).toBeUndefined();
    expect(result.ano).toBe(carData.ano);
    expect(result.modelo).toBe(carData.modelo);
    expect(result.cor).toBe(carData.cor);
    expect(result.quantidadePassageiros).toBe(carData.quantidadePassageiros);
  });

  it('should return 400 with errors if no accessory item exists when updating', async () => {
    const temp = await factory.create<Car>('Car');
    const tempData = {
      modelo: 'GM S10 2.8',
      cor: 'Verde',
      ano: 2021,
      acessorios: [],
      quantidadePassageiros: 5,
    };
    const response = await request(app)
      .put(`${PREFIX}/${temp.id}`)
      .set(token)
      .send(tempData);

    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('acessorios');
    expect(value[0].name).toBe('"acessorios" must contain at least 1 items');
  });

  it('should return 400 with errors if year greater than 2022 when updating', async () => {
    const temp = await factory.create<Car>('Car');
    const tempData = {
      modelo: 'GM S10 2.8',
      cor: 'Verde',
      ano: 2023,
      acessorios: [{ descricao: 'Ar-condicionado' }],
      quantidadePassageiros: 5,
    };
    const response = await request(app)
      .put(`${PREFIX}/${temp.id}`)
      .set(token)
      .send(tempData);

    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('ano');
    expect(value[0].name).toBe('"ano" must be less than or equal to 2022');
  });

  it('should return 400 with errors if year least than 1950 when updating', async () => {
    const temp = await factory.create<Car>('Car');
    const tempData = {
      modelo: 'GM S10 2.8',
      cor: 'Verde',
      ano: 1949,
      acessorios: [{ descricao: 'Ar-condicionado' }],
      quantidadePassageiros: 5,
    };
    const response = await request(app)
      .put(`${PREFIX}/${temp.id}`)
      .set(token)
      .send(tempData);

    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('ano');
    expect(value[0].name).toBe('"ano" must be greater than or equal to 1950');
  });

  it('should not update if accessory has duplicated item when updating', async () => {
    const temp = await factory.create<Car>('Car');
    const tempData = {
      modelo: 'GM S10 2.8',
      cor: 'Verde',
      ano: 2018,
      acessorios: [
        { descricao: 'Ar-condicionado' },
        { descricao: 'Ar-condicionado' },
      ],
      quantidadePassageiros: 5,
    };
    const response = await request(app)
      .put(`${PREFIX}/${temp.id}`)
      .set(token)
      .send(tempData);

    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('acessorios.1');
    expect(value[0].name).toBe('"acessorios[1]" contains a duplicate value');
  });

  it('should return 400 with errors if empty body when updating', async () => {
    const temp = await factory.create<Car>('Car');
    const response = await request(app)
      .put(`${PREFIX}/${temp.id}`)
      .set(token)
      .send({});

    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('modelo');
    expect(value[0].name).toBe('"modelo" is required');
  });

  /**
   * PATCH BY ID ACCESSORIES BY ID
   */

  it('should update a car accessory by its ID', async () => {
    const temp = await factory.create<Car>('Car');
    const response = await request(app)
      .patch(`${PREFIX}/${temp.id}/acessorios/${temp.acessorios[0].id}`)
      .set(token)
      .send({ descricao: 'Ar-condicionado' });

    const value = response.body;

    expect(response.status).toBe(200);
    expect(value._id).toBe(temp.id);
    expect(value.ano).toBe(temp.ano);
    expect(value.cor).toBe(temp.cor);
    expect(value.modelo).toBe(temp.modelo);
    expect(value.__v).toBeUndefined();
    expect(value.quantidadePassageiros).toBe(temp.quantidadePassageiros);
    expect(value.acessorios.length).toEqual(temp.acessorios.length);
    expect(value.acessorios[0].descricao).toBe('Ar-condicionado');
  });

  it('should remove a car accessory by its ID', async () => {
    const temp = await factory.create<Car>('Car');
    const response = await request(app)
      .patch(`${PREFIX}/${temp.id}/acessorios/${temp.acessorios[0].id}`)
      .set(token)
      .send({ descricao: temp.acessorios[0].descricao });

    const value = response.body;

    expect(response.status).toBe(200);
    expect(value._id).toBe(temp.id);
    expect(value.ano).toBe(temp.ano);
    expect(value.cor).toBe(temp.cor);
    expect(value.modelo).toBe(temp.modelo);
    expect(value.__v).toBeUndefined();
    expect(value.quantidadePassageiros).toBe(temp.quantidadePassageiros);
    expect(value.acessorios.length).toEqual(0);
  });

  it('should return 400 when missing body', async () => {
    const temp = await factory.create<Car>('Car');
    const response = await request(app)
      .patch(`${PREFIX}/${temp.id}/acessorios/${temp.acessorios[0].id}`)
      .set(token)
      .send({});

    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('descricao');
    expect(value[0].name).toBe('"descricao" is required');
  });

  it('should return 400 when white spaces on descricao', async () => {
    const temp = await factory.create<Car>('Car');
    const response = await request(app)
      .patch(`${PREFIX}/${temp.id}/acessorios/${temp.acessorios[0].id}`)
      .set(token)
      .send({ descricao: '   ' });

    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('descricao');
    expect(value[0].name).toBe('"descricao" is not allowed to be empty');
  });

  it('should return 400 when invalid ID on patch', async () => {
    const temp = await factory.create<Car>('Car');
    const response = await request(app)
      .patch(`${PREFIX}/125/acessorios/${temp.acessorios[0].id}`)
      .set(token)
      .send({ descricao: 'vidro eletrico' });

    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('id');
    expect(value[0].name).toBe('"id" length must be 24 characters long');
  });

  it('should return 400 when invalid ID on patch', async () => {
    const temp = await factory.create<Car>('Car');
    const response = await request(app)
      .patch(`${PREFIX}/${temp.id}/acessorios/789asd`)
      .set(token)
      .send({ descricao: 'vidro eletrico' });

    const value = response.body;

    expect(response.status).toBe(400);
    expect(value.length).toBeGreaterThanOrEqual(1);
    expect(value[0].description).toBe('idAccessory');
    expect(value[0].name).toBe(
      '"idAccessory" length must be 24 characters long'
    );
  });
});
