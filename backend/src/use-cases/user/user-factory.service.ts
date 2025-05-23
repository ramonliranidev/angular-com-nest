import { CreateUserDto, UpdateUserDto } from '@core/dtos/user.dto';
import { User } from '@core/entities/user.entity';
import { encryptPassword } from '@helpers/encryptPassword';
import { Injectable } from '@nestjs/common';
import { chain, get, isNull, isUndefined } from 'lodash';

@Injectable()
export class UserFactoryService {
  async createNewUser(createUserDto: CreateUserDto) {
    const newUser = new User();

    newUser.name = createUserDto.name;
    newUser.email = createUserDto.email;
    newUser.phoneNumber = createUserDto.phoneNumber;
    newUser.document = createUserDto.document;

    newUser.password = encryptPassword(createUserDto.password);
    newUser.active = get(createUserDto, 'active', true);

    return newUser;
  }

  updateUser(updateUserDto: UpdateUserDto) {
    const newUser = new User();
    newUser.name = updateUserDto.name;
    newUser.email = updateUserDto.email;
    newUser.username = updateUserDto.username;
    newUser.document = updateUserDto.document;

    newUser.phoneNumber = updateUserDto.phoneNumber;
    newUser.password = updateUserDto.password
      ? encryptPassword(updateUserDto.password)
      : null;
    newUser.active = updateUserDto.active;

    return chain(newUser).omitBy(isNull).omitBy(isUndefined).value();
  }
}
