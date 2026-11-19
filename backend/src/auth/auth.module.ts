import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './controllers/auth.controller';
import { Session, SessionSchema } from './schemas/session.schema';
import { User, UserSchema } from './schemas/user.schema';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
