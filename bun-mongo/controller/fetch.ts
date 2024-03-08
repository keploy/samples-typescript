import { Animal } from './../database/database.type';

export default class MongoIntegration {
    async Save() {
        const cow = new Animal({
            name: 'Cow',
            sound: 'Moo',
        });
        await cow.save();
        return {"success":true};
    }
    async Fetch() {
        const animal = await Animal.findOne({"name":"Cow"});
        return {"success":animal};
    }
    async Put() {
        const query = { name: 'name' };
        const update = {
          $set: {
            name: "cows",
          },
        };
        let animal = await Animal.updateMany(query,update);
        return {"success":animal};
    }
    async Delete() {
        const animal = await Animal.deleteMany({"name":'Cow'});
        return {"success":animal};
    }
}