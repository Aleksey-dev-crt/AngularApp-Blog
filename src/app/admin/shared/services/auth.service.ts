import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {FbAuthResponse, User} from '../../../shared/interfaces';
import {Observable, Subject, throwError} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {catchError, tap} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class AuthService {

    public error$: Subject<string> = new Subject<string>()

   constructor(private http: HttpClient) {}

   get token(): string {
       const expDate = new Date(localStorage.getItem('fb-token-exp'))
       if (new Date() > expDate) {
           this.logout()
           return null
       }
       return localStorage.getItem('fb-token')
   }

   login(user: User): Observable<any> {
       user.returnSecureToken = true
       return this.http.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.apiKey}`, user)
        .pipe(
            tap(this.setToken),
            catchError(this.handleError.bind(this))
        )
   }

   logout() {
       this.setToken(null)
   }

   isAuthenticated(): boolean {
       return !!this.token
   }

   private handleError(error: HttpErrorResponse) {
        const {message} = error.error.error

       switch (message) {
           case 'EMAIL_NOT_FOUND':
                this.error$.next('Неверный E-mail')
               break
           case 'INVALID_PASSWORD':
               this.error$.next('Неверный Пароль')
               break
           case 'INVALID_EMAIL':
               this.error$.next('E-mail не существует')
               break
           case 'TOO_MANY_ATTEMPTS_TRY_LATER : Too many unsuccessful login attempts. Please try again later.':
               this.error$.next('Слишком много неудачных попыток входа в систему. Пожалуйста, попробуйте позже.')
               break
       }

       return throwError(error)
   }

   private setToken(response: FbAuthResponse) {
       if (response) {
           const expDate = new Date(new Date().getTime() + +response.expiresIn * 1000)
           localStorage.setItem('fb-token', response.idToken)
           localStorage.setItem('fb-token-exp', expDate.toString())
       } else {
           localStorage.clear()
       }

   }
}
